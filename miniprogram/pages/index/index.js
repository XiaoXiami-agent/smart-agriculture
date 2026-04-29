// 农业App首页
const app = getApp()

// 初始化云数据库
const db = wx.cloud.database()

Page({
  data: {
    location: '深圳',
    locationId: '101280601',
    now: null,
    forecast: null,
    lunar: '',
    loading: true,
    alerts: [],
    advices: [],
    todayTasks: [],
    cityList: ['深圳', '广州', '北京', '上海', '杭州', '成都'],
    // 作物统计数据
    cropStats: {
      total: 0,
      growth: 0,
      seedling: 0,
      harvest: 0
    }
  },

  onLoad() {
    this.getLocation()
    this.getCropStats()
    this.getTasks()
  },

  onShow() {
    this.getCropStats()
    this.getTasks()
  },

  // 获取位置信息
  getLocation() {
    const that = this
    wx.getStorage({
      key: 'location',
      success: (res) => {
        if (res.data) {
          that.setData({
            location: res.data.name,
            locationId: res.data.id
          })
          that.getWeather(res.data.id)
        } else {
          that.getWeather('101280601')
        }
      },
      fail: () => {
        that.getWeather('101280601')
      }
    })
  },

  // 选择城市
  onCityChange(e) {
    const cities = ['深圳', '广州', '北京', '上海', '杭州', '成都']
    const index = e.detail.value
    this.getWeatherByCity(cities[index])
  },

  // 获取当前位置
  getCurrentLocation() {
    wx.showLoading({ title: '定位中...' })
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        const lat = res.latitude
        const lng = res.longitude
        console.log('坐标:', lat, lng)
        
        // 调用云函数直接用坐标查询天气
        wx.cloud.callFunction({
          name: 'weatherApi',
          data: { latitude: lat, longitude: lng }
        }).then(result => {
          wx.hideLoading()
          console.log('云函数返回:', result)
          const res = result.result
          
          if (res && res.now && res.now.code === '200') {
            const info = res.locationInfo
            this.setData({ 
              location: info.name || '未知',
              locationId: info.id || '',
              now: res.now.now,
              forecast: res.forecast,
              loading: false
            })
            wx.showToast({ title: '获取天气成功', icon: 'none' })
          } else {
            wx.showToast({ title: '获取天气失败，请手动选择城市', icon: 'none' })
          }
        }).catch(err => {
          wx.hideLoading()
          console.error('云函数调用失败:', err)
          wx.showToast({ title: '网络错误，请手动选择城市', icon: 'none' })
        })
      },
      fail: (err) => {
        wx.hideLoading()
        console.log('定位失败:', err)
        wx.showToast({ title: '定位失败，请手动选择城市', icon: 'none' })
      }
    })
  },

  // 通过城市名获取天气
  getWeatherByCity(cityName) {
    // 城市代码映射
    const cityMap = {
      '北京': '101010100', '上海': '101020100', '广州': '101280101',
      '深圳': '101280601', '杭州': '101210101', '成都': '101270101',
      '武汉': '101200101', '西安': '101110101', '南京': '101190101',
      '重庆': '101040100'
    }
    const locationId = cityMap[cityName] || '101280601'
    this.setData({ location: cityName, locationId })
    this.getWeather(locationId)
    // 保存到本地
    wx.setStorage({ key: 'location', data: { name: cityName, id: locationId } })
  },

  // 获取作物统计数据
  getCropStats() {
    db.collection('crops').count().then(res => {
      this.setData({
        'cropStats.total': res.total
      })
    }).catch(err => {
      console.error('获取作物统计失败:', err)
    })

    // 统计各状态数量
    db.collection('crops').where({ status: 'growth' }).count().then(res => {
      this.setData({ 'cropStats.growth': res.total })
    })

    db.collection('crops').where({ status: 'seedling' }).count().then(res => {
      this.setData({ 'cropStats.seedling': res.total })
    })

    db.collection('crops').where({ status: 'harvest' }).count().then(res => {
      this.setData({ 'cropStats.harvest': res.total })
    })
  },

  // 获取天气数据
  getWeather(locationId) {
    this.setData({ loading: true })
    
    wx.cloud.callFunction({
      name: 'weatherApi',
      data: { location: locationId, type: 'all' }
    }).then(res => {
      const result = res.result
      
      if (result.now && result.now.code === '200') {
        let forecastData = null
        if (result.forecast && result.forecast.code === '200') {
          forecastData = result.forecast
        }
        
        this.setData({ 
          now: result.now.now,
          forecast: forecastData,
          loading: false
        })
        
        // 生成农事建议
        this.generateAdvices(result.now.now)
        // 检查预警
        this.checkAlerts(result.now.now)
      } else {
        wx.showToast({ title: '获取天气失败', icon: 'none' })
        this.setData({ loading: false })
      }
    }).catch(err => {
      console.error('获取天气失败:', err)
      wx.showToast({ title: '网络请求失败', icon: 'none' })
      this.setData({ loading: false })
    })
  },

  // 获取今日任务
  getTasks() {
    const today = new Date()
    const todayStr = today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0')

    // 任务类型映射
    const typeMap = {
      'irrigation': { icon: '💧', text: '浇水' },
      'fertilization': { icon: '🧪', text: '施肥' },
      'weeding': { icon: '🌿', text: '除草' },
      'inspection': { icon: '🔍', text: '检查' }
    }

    // 从云数据库获取今日待处理任务
    db.collection('tasks')
      .where({
        status: 'pending',
        dueDate: todayStr
      })
      .limit(3)  // 只显示前3条
      .get()
      .then(res => {
        const tasks = res.data.map(task => ({
          _id: task._id,
          title: task.title,
          cropName: task.cropName,
          typeIcon: typeMap[task.type] ? typeMap[task.type].icon : '📋',
          type: task.type
        }))
        this.setData({ todayTasks: tasks })
      })
      .catch(err => {
        console.error('获取任务失败:', err)
        // 使用模拟数据作为后备
        const mockTasks = [
          { _id: '1', typeIcon: '💧', title: '浇水', cropName: '番茄' },
          { _id: '2', typeIcon: '🧪', title: '施肥', cropName: '小麦' }
        ]
        this.setData({ todayTasks: mockTasks })
      })
  },

  // 生成农事建议
  generateAdvices(weather) {
    const advices = []
    const temp = parseInt(weather.temp)
    const humidity = parseInt(weather.humidity)
    const text = weather.text || ''
    const hasRain = text.includes('雨')
    
    // 温度建议
    if (temp < 5) {
      advices.push({ type: 'danger', icon: '⚠️', text: '低温预警！注意防霜冻，建议覆盖保温膜' })
    } else if (temp < 15) {
      advices.push({ type: 'info', icon: '🌡️', text: '气温较低，适合浇水但避免喷药（低温效果差）' })
    } else if (temp >= 15 && temp <= 30) {
      advices.push({ type: 'success', icon: '✅', text: '温度适宜，是进行浇水、施肥、喷药的好时机' })
    } else if (temp > 35) {
      advices.push({ type: 'danger', icon: '⚠️', text: '高温预警！避免中午作业，注意及时灌溉' })
    }
    
    // 降雨建议
    if (hasRain) {
      advices.push({ type: 'info', icon: '🌧️', text: '今日有雨，可适当减少灌溉' })
    } else {
      advices.push({ type: 'warning', icon: '💧', text: '无降雨，注意观察土壤湿度，及时补水' })
    }
    
    // 湿度建议
    if (humidity > 85) {
      advices.push({ type: 'warning', icon: '💦', text: '湿度较高，注意通风防病' })
    } else if (humidity < 40) {
      advices.push({ type: 'warning', icon: '🏜️', text: '空气干燥，蒸发量大，加强灌溉' })
    }
    
    this.setData({ advices })
  },

  // 检查天气预警
  checkAlerts(weather) {
    const alerts = []
    const temp = parseInt(weather.temp)
    const text = weather.text || ''
    
    if (temp < 3) {
      alerts.push({ text: '霜冻红色预警，请做好防冻措施' })
    } else if (temp > 38) {
      alerts.push({ text: '高温橙色预警，减少户外作业' })
    }
    
    if (text.includes('暴雨') || text.includes('雷阵雨')) {
      alerts.push({ text: '恶劣天气，注意农田排水' })
    }
    
    this.setData({ alerts })
  },

  // 跳转到任务页面
  goToTasks() {
    wx.switchTab({
      url: '/pages/tasks/today/today'
    })
  },

  // 跳转到灌溉管理页面
  goToIrrigation() {
    wx.navigateTo({
      url: '/pages/irrigation/irrigation'
    })
  }
})

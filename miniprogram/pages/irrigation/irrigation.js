// 灌溉管理页面
const db = wx.cloud.database()

Page({
  data: {
    avgHumidity: 65,
    humidityTips: [],
    cropHumidity: [],
    advices: [],
    // 历史记录相关
    showHistory: false,
    historyList: [],
    selectedCrop: null,
    weekData: []
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const cropHumidity = [
      {
        name: '番茄',
        icon: '🍅',
        stage: '开花期',
        humidity: 72,
        status: 'normal',
        statusText: '适中',
        tip: '保持当前浇水频率即可'
      },
      {
        name: '黄瓜',
        icon: '🥒',
        stage: '幼苗期',
        humidity: 45,
        status: 'low',
        statusText: '偏低',
        tip: '需要增加浇水频率，建议每天浇水'
      },
      {
        name: '辣椒',
        icon: '🌶️',
        stage: '生长期',
        humidity: 58,
        status: 'normal',
        statusText: '适中',
        tip: '可适当减少浇水'
      },
      {
        name: '白菜',
        icon: '🥬',
        stage: '幼苗期',
        humidity: 38,
        status: 'low',
        statusText: '偏低',
        tip: '土壤较干，需要立即浇水'
      }
    ]
    
    // 计算平均湿度
    const avgHumidity = Math.round(
      cropHumidity.reduce((sum, c) => sum + c.humidity, 0) / cropHumidity.length
    )
    
    // 生成提示
    const humidityTips = []
    if (avgHumidity < 40) {
      humidityTips.push({ type: 'danger', text: '土壤整体偏干，需要加强灌溉' })
    } else if (avgHumidity > 80) {
      humidityTips.push({ type: 'warning', text: '土壤偏湿，注意控制浇水' })
    } else {
      humidityTips.push({ type: 'success', text: '土壤湿度适中' })
    }
    
    // 生成建议
    const advices = []
    const lowHumidityCrops = cropHumidity.filter(c => c.humidity < 50)
    if (lowHumidityCrops.length > 0) {
      advices.push({
        icon: '⚠️',
        text: `${lowHumidityCrops.map(c => c.name).join('、')}需要立即补水`
      })
    }
    
    const rainCrops = cropHumidity.filter(c => c.humidity > 70)
    if (rainCrops.length > 0) {
      advices.push({
        icon: '💡',
        text: `${rainCrops.map(c => c.name).join('、')}可减少浇水频率`
      })
    }
    
    if (advices.length === 0) {
      advices.push({
        icon: '✅',
        text: '各作物灌溉状态良好，按常规计划进行即可'
      })
    }
    
    this.setData({
      avgHumidity,
      cropHumidity,
      humidityTips,
      advices
    })
  },

  refreshData() {
    wx.showLoading({ title: '刷新中...' })
    setTimeout(() => {
      this.loadData()
      wx.hideLoading()
      wx.showToast({ title: '刷新成功', icon: 'success' })
    }, 500)
  },

  viewHistory() {
    this.loadHistoryData()
  },

  // 加载历史数据
  loadHistoryData() {
    const historyList = [
      {
        date: '今天',
        dateStr: this.formatDate(0),
        avgHumidity: 65,
        records: [
          { crop: '番茄', humidity: 72, change: '+5' },
          { crop: '黄瓜', humidity: 45, change: '-3' },
          { crop: '辣椒', humidity: 58, change: '+2' },
          { crop: '白菜', humidity: 38, change: '-8' }
        ]
      },
      {
        date: '昨天',
        dateStr: this.formatDate(-1),
        avgHumidity: 62,
        records: [
          { crop: '番茄', humidity: 67, change: '+3' },
          { crop: '黄瓜', humidity: 48, change: '-5' },
          { crop: '辣椒', humidity: 56, change: '+1' },
          { crop: '白菜', humidity: 46, change: '-2' }
        ]
      },
      {
        date: '2天前',
        dateStr: this.formatDate(-2),
        avgHumidity: 58,
        records: [
          { crop: '番茄', humidity: 64, change: '+8' },
          { crop: '黄瓜', humidity: 53, change: '+6' },
          { crop: '辣椒', humidity: 55, change: '+3' },
          { crop: '白菜', humidity: 48, change: '+5' }
        ]
      },
      {
        date: '3天前',
        dateStr: this.formatDate(-3),
        avgHumidity: 55,
        records: [
          { crop: '番茄', humidity: 56, change: '-4' },
          { crop: '黄瓜', humidity: 47, change: '-6' },
          { crop: '辣椒', humidity: 52, change: '+2' },
          { crop: '白菜', humidity: 43, change: '-7' }
        ]
      },
      {
        date: '4天前',
        dateStr: this.formatDate(-4),
        avgHumidity: 52,
        records: [
          { crop: '番茄', humidity: 60, change: '+2' },
          { crop: '黄瓜', humidity: 53, change: '+8' },
          { crop: '辣椒', humidity: 50, change: '-3' },
          { crop: '白菜', humidity: 50, change: '+10' }
        ]
      },
      {
        date: '5天前',
        dateStr: this.formatDate(-5),
        avgHumidity: 48,
        records: [
          { crop: '番茄', humidity: 58, change: '-2' },
          { crop: '黄瓜', humidity: 45, change: '-4' },
          { crop: '辣椒', humidity: 53, change: '+5' },
          { crop: '白菜', humidity: 40, change: '-5' }
        ]
      },
      {
        date: '6天前',
        dateStr: this.formatDate(-6),
        avgHumidity: 51,
        records: [
          { crop: '番茄', humidity: 60, change: '+4' },
          { crop: '黄瓜', humidity: 49, change: '+7' },
          { crop: '辣椒', humidity: 48, change: '-2' },
          { crop: '白菜', humidity: 45, change: '+3' }
        ]
      }
    ]
    
    this.setData({
      showHistory: true,
      historyList
    })
  },

  // 格式化日期
  formatDate(days) {
    const date = new Date()
    date.setDate(date.getDate() + days)
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}月${day}日`
  },

  // 选择作物查看详细历史
  selectCrop(e) {
    const cropName = e.currentTarget.dataset.crop
    const selectedCrop = this.data.cropHumidity.find(c => c.name === cropName)
    
    // 生成该作物7天数据
    const baseHumidity = selectedCrop.humidity
    const weekData = []
    for (let i = 6; i >= 0; i--) {
      const variance = Math.floor(Math.random() * 15) - 7
      weekData.push({
        date: this.formatDate(-i),
        humidity: Math.max(20, Math.min(95, baseHumidity + variance * (7 - i) / 2))
      })
    }
    
    this.setData({
      selectedCrop,
      weekData,
      showCropDetail: true
    })
  },

  // 关闭历史记录弹窗
  closeHistory() {
    this.setData({
      showHistory: false,
      showCropDetail: false
    })
  },

  // 导出数据
  exportData() {
    wx.showLoading({ title: '导出中...' })
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({ title: '导出成功', icon: 'success' })
      this.closeHistory()
    }, 1000)
  }
})

// 作物列表页面
const db = wx.cloud.database()

Page({
  data: {
    crops: [],
    loading: true
  },

  onLoad() {
    this.loadCrops()
  },

  onShow() {
    this.loadCrops()
  },

  // 加载作物列表
  loadCrops() {
    this.setData({ loading: true })
    
    db.collection('crops').get().then(res => {
      // 处理作物数据，计算种植天数
      const crops = res.data.map(crop => {
        const plantDate = new Date(crop.plantDate)
        const today = new Date()
        const days = Math.floor((today - plantDate) / (1000 * 60 * 60 * 24))
        
        // 状态映射
        const statusMap = {
          'growth': { text: '生长期', class: 'normal' },
          'seedling': { text: '幼苗期', class: 'normal' },
          'harvest': { text: '待收获', class: 'warning' }
        }
        
        // 图标映射
        const iconMap = {
          '粮食作物': '🌾',
          '蔬菜': '🥬',
          '水果': '🍎',
          '其他': '🌱'
        }
        
        return {
          ...crop,
          days,
          stage: statusMap[crop.status] ? statusMap[crop.status].text : '未知',
          statusText: statusMap[crop.status] ? statusMap[crop.status].text : '未知',
          status: statusMap[crop.status] ? statusMap[crop.status].class : 'normal',
          icon: iconMap[crop.type] || '🌱'
        }
      })
      
      this.setData({
        crops,
        loading: false
      })
    }).catch(err => {
      console.error('获取作物列表失败:', err)
      wx.showToast({ title: '获取数据失败', icon: 'none' })
      this.setData({ loading: false })
    })
  },

  // 跳转到添加作物页面
  goToAdd() {
    wx.navigateTo({
      url: '/pages/crops/add/add'
    })
  },

  // 跳转到作物详情页面
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/crops/detail/detail?id=' + id
    })
  }
})

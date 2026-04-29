// 作物详情页面
const db = wx.cloud.database()

Page({
  data: {
    cropId: '',
    crop: null,
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ cropId: options.id })
      this.loadCropDetail(options.id)
    }
  },

  // 加载作物详情
  loadCropDetail(id) {
    this.setData({ loading: true })
    
    db.collection('crops').doc(id).get().then(res => {
      const crop = res.data
      
      // 计算种植天数
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
      
      this.setData({
        crop: {
          ...crop,
          days,
          stage: statusMap[crop.status] ? statusMap[crop.status].text : '未知',
          statusText: statusMap[crop.status] ? statusMap[crop.status].text : '未知',
          status: statusMap[crop.status] ? statusMap[crop.status].class : 'normal',
          icon: iconMap[crop.type] || '🌱'
        },
        loading: false
      })
    }).catch(err => {
      console.error('获取作物详情失败:', err)
      wx.showToast({ title: '获取数据失败', icon: 'none' })
      this.setData({ loading: false })
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 编辑作物
  editCrop() {
    const crop = this.data.crop
    wx.navigateTo({
      url: `/pages/crops/edit/edit?id=${crop._id}&name=${crop.name}&type=${crop.type}&variety=${crop.variety || ''}&plantDate=${crop.plantDate}&status=${crop.status}&notes=${crop.notes || ''}`
    })
  },

  // 删除作物
  deleteCrop() {
    const that = this
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个作物吗？删除后无法恢复。',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          
          db.collection('crops').doc(that.data.cropId).remove().then(res => {
            wx.hideLoading()
            wx.showToast({ title: '删除成功', icon: 'success' })
            
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          }).catch(err => {
            wx.hideLoading()
            console.error('删除失败:', err)
            wx.showToast({ title: '删除失败', icon: 'none' })
          })
        }
      }
    })
  }
})

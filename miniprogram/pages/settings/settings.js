// 设置页面
Page({
  data: {
    location: '深圳',
    alerts: {
      frost: true,
      highTemp: true,
      heavyRain: true,
      drought: true
    },
    notification: true,
    cacheSize: '2.5MB'
  },

  onLoad() {
    this.loadSettings()
  },

  // 加载设置
  loadSettings() {
    const that = this
    
    wx.getStorage({
      key: 'settings',
      success: (res) => {
        if (res.data) {
          that.setData(res.data)
        }
      }
    })
    
    wx.getStorage({
      key: 'location',
      success: (res) => {
        if (res.data) {
          that.setData({ location: res.data.name })
        }
      }
    })
  },

  // 保存设置
  saveSettings() {
    const { alerts, notification } = this.data
    wx.setStorage({
      key: 'settings',
      data: { alerts, notification }
    })
  },

  // 切换预警
  toggleAlert(e) {
    const type = e.currentTarget.dataset.type
    const value = e.detail.value
    const alerts = this.data.alerts
    alerts[type] = value
    this.setData({ alerts })
    this.saveSettings()
  },

  // 切换通知
  toggleNotification(e) {
    this.setData({ notification: e.detail.value })
    this.saveSettings()
  },

  // 更改位置
  changeLocation() {
    wx.showToast({ title: '定位功能开发中', icon: 'none' })
  },

  // 清除缓存
  clearCache() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          this.setData({ cacheSize: '0MB' })
          wx.showToast({ title: '清除成功', icon: 'success' })
        }
      }
    })
  },

  // 检查更新
  checkUpdate() {
    wx.showToast({ title: '已是最新版本', icon: 'success' })
  },

  // 显示关于
  showAbout() {
    wx.showModal({
      title: '关于智慧农业',
      content: '智慧农业App是一款帮助农民和园艺爱好者管理作物、记录农事活动的工具。通过结合天气数据，提供智能化的农事建议，让种植更简单高效。',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})

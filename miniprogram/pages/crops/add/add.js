// 添加作物页面
const db = wx.cloud.database()

Page({
  data: {
    // 作物数据映射
    cropsMap: {
      tomato: { icon: '🍅', name: '番茄', type: '蔬菜' },
      cucumber: { icon: '🥒', name: '黄瓜', type: '蔬菜' },
      pepper: { icon: '🌶️', name: '辣椒', type: '蔬菜' },
      eggplant: { icon: '🍆', name: '茄子', type: '蔬菜' },
      cabbage: { icon: '🥬', name: '白菜', type: '蔬菜' },
      corn: { icon: '🌽', name: '玉米', type: '粮食作物' },
      strawberry: { icon: '🍓', name: '草莓', type: '水果' },
      grape: { icon: '🍇', name: '葡萄', type: '水果' }
    },
    selectedCrop: '',
    selectedType: '',
    selectedIcon: '',
    name: '',
    varieties: [],
    selectedVariety: '',
    plantDate: '',
    status: 'seedling',
    notes: ''
  },

  onLoad() {
    // 设置默认日期为今天
    const today = new Date()
    const dateStr = today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0')
    this.setData({ plantDate: dateStr })
  },

  // 选择作物类型
  selectCrop(e) {
    const { value, type, icon } = e.currentTarget.dataset
    
    this.setData({
      selectedCrop: value,
      selectedType: type,
      selectedIcon: icon
    })
    
    // 加载品种列表
    this.loadVarieties(value)
  },

  // 加载品种列表
  loadVarieties(cropType) {
    const varietiesMap = {
      tomato: ['大粉番茄', '樱桃番茄', '千禧番茄', '黑番茄'],
      cucumber: ['水果黄瓜', '刺黄瓜', '荷兰黄瓜'],
      pepper: ['朝天椒', '青椒', '甜椒', '线椒'],
      eggplant: ['紫长茄', '圆茄', '青茄'],
      cabbage: ['大白菜', '小白菜', '娃娃菜'],
      corn: ['甜玉米', '糯玉米', '普通玉米'],
      strawberry: ['红颜草莓', '章姬草莓', '白雪公主'],
      grape: ['巨峰', '阳光玫瑰', '夏黑']
    }
    
    this.setData({
      varieties: varietiesMap[cropType] || [],
      selectedVariety: ''
    })
  },

  // 输入名称
  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  // 选择品种
  onVarietyChange(e) {
    const index = e.detail.value
    if (this.data.varieties[index]) {
      this.setData({ selectedVariety: this.data.varieties[index] })
    }
  },

  // 选择种植日期
  onDateChange(e) {
    this.setData({ plantDate: e.detail.value })
  },

  // 选择生长状态
  selectStatus(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ status })
  },

  // 输入备注
  onNotesInput(e) {
    this.setData({ notes: e.detail.value })
  },

  // 提交表单
  submitForm() {
    const { selectedCrop, selectedType, selectedIcon, name, selectedVariety, plantDate, status, notes } = this.data
    
    // 验证必填项
    if (!selectedCrop) {
      wx.showToast({ title: '请选择作物类型', icon: 'none' })
      return
    }
    if (!name.trim()) {
      wx.showToast({ title: '请输入作物名称', icon: 'none' })
      return
    }
    
    wx.showLoading({ title: '保存中...' })
    
    // 构建作物数据
    const cropData = {
      name: name.trim(),
      type: selectedType,
      variety: selectedVariety || '',
      icon: selectedIcon,
      plantDate: plantDate,
      status: status,
      notes: notes,
      createdAt: new Date().toISOString().split('T')[0]
    }
    
    // 保存到云数据库
    db.collection('crops').add({
      data: cropData
    }).then(res => {
      wx.hideLoading()
      wx.showToast({ title: '添加成功', icon: 'success' })
      
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }).catch(err => {
      wx.hideLoading()
      console.error('保存失败:', err)
      wx.showToast({ title: '保存失败', icon: 'none' })
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  }
})

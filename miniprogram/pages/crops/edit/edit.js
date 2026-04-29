// 编辑作物页面
const db = wx.cloud.database()

Page({
  data: {
    cropId: '',
    // 作物类型（按大类分类）
    cropTypes: [
      { name: '🍅 番茄', value: 'tomato', type: '蔬菜' },
      { name: '🥒 黄瓜', value: 'cucumber', type: '蔬菜' },
      { name: '🌶️ 辣椒', value: 'pepper', type: '蔬菜' },
      { name: '🍆 茄子', value: 'eggplant', type: '蔬菜' },
      { name: '🥬 白菜', value: 'cabbage', type: '蔬菜' },
      { name: '🥕 萝卜', value: 'radish', type: '蔬菜' },
      { name: '🌽 玉米', value: 'corn', type: '粮食作物' },
      { name: '🍓 草莓', value: 'strawberry', type: '水果' },
      { name: '🍇 葡萄', value: 'grape', type: '水果' },
      { name: '🍉 西瓜', value: 'watermelon', type: '水果' },
      { name: '🌾 水稻', value: 'rice', type: '粮食作物' },
      { name: '🌿 小麦', value: 'wheat', type: '粮食作物' }
    ],
    // 状态选项
    statusOptions: [
      { name: '幼苗期', value: 'seedling' },
      { name: '生长期', value: 'growth' },
      { name: '待收获', value: 'harvest' }
    ],
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

  onLoad(options) {
    if (options.id) {
      this.setData({ cropId: options.id })
      this.loadCropData(options.id)
    }
  },

  // 加载作物数据
  loadCropData(id) {
    wx.showLoading({ title: '加载中...' })
    
    db.collection('crops').doc(id).get().then(res => {
      wx.hideLoading()
      const crop = res.data
      
      // 图标到类型映射
      const iconMap = {
        '🍅': 'tomato', '🥒': 'cucumber', '🌶️': 'pepper', '🍆': 'eggplant',
        '🥬': 'cabbage', '🥕': 'radish', '🌽': 'corn', '🍓': 'strawberry',
        '🍇': 'grape', '🍉': 'watermelon', '🌾': 'rice', '🌿': 'wheat'
      }
      
      const cropTypeMap = {
        'tomato': '蔬菜', 'cucumber': '蔬菜', 'pepper': '蔬菜', 'eggplant': '蔬菜',
        'cabbage': '蔬菜', 'radish': '蔬菜', 'corn': '粮食作物', 'strawberry': '水果',
        'grape': '水果', 'watermelon': '水果', 'rice': '粮食作物', 'wheat': '粮食作物'
      }
      
      // 根据类型获取品种
      const varietiesMap = {
        tomato: ['大粉番茄', '樱桃番茄', '千禧番茄', '黑番茄'],
        cucumber: ['水果黄瓜', '刺黄瓜', '荷兰黄瓜'],
        pepper: ['朝天椒', '青椒', '甜椒', '线椒'],
        eggplant: ['紫长茄', '圆茄', '青茄'],
        cabbage: ['大白菜', '小白菜', '娃娃菜'],
        radish: ['白萝卜', '红萝卜', '青萝卜'],
        corn: ['甜玉米', '糯玉米', '普通玉米'],
        strawberry: ['红颜草莓', '章姬草莓', '白雪公主'],
        grape: ['巨峰', '阳光玫瑰', '夏黑'],
        watermelon: ['麒麟瓜', '黑美人', '无籽西瓜'],
        rice: ['早稻', '晚稻', '杂交水稻'],
        wheat: ['冬小麦', '春小麦', '济麦22']
      }
      
      const selectedCrop = iconMap[crop.icon] || ''
      
      this.setData({
        selectedCrop: selectedCrop,
        selectedType: cropTypeMap[selectedCrop] || crop.type,
        selectedIcon: crop.icon,
        name: crop.name,
        varieties: varietiesMap[selectedCrop] || [],
        selectedVariety: crop.variety || '',
        plantDate: crop.plantDate,
        status: crop.status,
        notes: crop.notes || ''
      })
    }).catch(err => {
      wx.hideLoading()
      console.error('加载作物数据失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  // 选择作物类型
  selectCrop(e) {
    const { value, type } = e.currentTarget.dataset
    const crops = {
      tomato: { icon: '🍅', name: '番茄' },
      cucumber: { icon: '🥒', name: '黄瓜' },
      pepper: { icon: '🌶️', name: '辣椒' },
      eggplant: { icon: '🍆', name: '茄子' },
      cabbage: { icon: '🥬', name: '白菜' },
      radish: { icon: '🥕', name: '萝卜' },
      corn: { icon: '🌽', name: '玉米' },
      strawberry: { icon: '🍓', name: '草莓' },
      grape: { icon: '🍇', name: '葡萄' },
      watermelon: { icon: '🍉', name: '西瓜' },
      rice: { icon: '🌾', name: '水稻' },
      wheat: { icon: '🌿', name: '小麦' }
    }
    
    const crop = crops[value]
    this.setData({
      selectedCrop: value,
      selectedType: type,
      selectedIcon: crop.icon,
      name: crop.name
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
      radish: ['白萝卜', '红萝卜', '青萝卜'],
      corn: ['甜玉米', '糯玉米', '普通玉米'],
      strawberry: ['红颜草莓', '章姬草莓', '白雪公主'],
      grape: ['巨峰', '阳光玫瑰', '夏黑'],
      watermelon: ['麒麟瓜', '黑美人', '无籽西瓜'],
      rice: ['早稻', '晚稻', '杂交水稻'],
      wheat: ['冬小麦', '春小麦', '济麦22']
    }
    
    this.setData({
      varieties: varietiesMap[cropType] || [],
      selectedVariety: null
    })
  },

  // 输入名称
  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  // 选择品种
  onVarietyChange(e) {
    const index = e.detail.value
    this.setData({ selectedVariety: this.data.varieties[index] })
  },

  // 选择种植日期
  onDateChange(e) {
    this.setData({ plantDate: e.detail.value })
  },

  // 选择状态
  onStatusChange(e) {
    const index = e.detail.value
    this.setData({ status: this.data.statusOptions[index].value })
  },

  // 输入备注
  onNotesInput(e) {
    this.setData({ notes: e.detail.value })
  },

  // 提交表单
  submitForm() {
    const { cropId, selectedType, selectedIcon, name, selectedVariety, plantDate, status, notes } = this.data
    
    if (!name.trim()) {
      wx.showToast({ title: '请输入作物名称', icon: 'none' })
      return
    }
    
    wx.showLoading({ title: '保存中...' })
    
    // 更新数据
    db.collection('crops').doc(cropId).update({
      data: {
        name: name.trim(),
        type: selectedType,
        variety: selectedVariety || '',
        icon: selectedIcon,
        plantDate: plantDate,
        status: status,
        notes: notes
      }
    }).then(res => {
      wx.hideLoading()
      wx.showToast({ title: '更新成功', icon: 'success' })
      
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }).catch(err => {
      wx.hideLoading()
      console.error('更新失败:', err)
      wx.showToast({ title: '更新失败', icon: 'none' })
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  }
})

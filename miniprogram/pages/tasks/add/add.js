// 添加任务页面
const db = wx.cloud.database()

Page({
  data: {
    // 任务类型
    taskTypes: [
      { name: '灌溉', value: 'irrigation', icon: '💧' },
      { name: '施肥', value: 'fertilization', icon: '🧪' },
      { name: '除草', value: 'weeding', icon: '🌿' },
      { name: '检查', value: 'inspection', icon: '🔍' }
    ],
    // 表单数据
    title: '',
    type: 'irrigation',
    cropName: '',
    dueDate: '',
    priority: 'medium',
    notes: '',
    // 作物列表（用于选择）
    crops: []
  },

  onLoad() {
    // 设置默认日期为今天
    const today = new Date()
    const dateStr = today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0')
    this.setData({ dueDate: dateStr })
    
    // 加载作物列表
    this.loadCrops()
  },

  // 加载作物列表
  loadCrops() {
    db.collection('crops').field({ name: true }).get().then(res => {
      this.setData({ crops: res.data })
    }).catch(err => {
      console.error('获取作物列表失败:', err)
    })
  },

  // 选择任务类型
  selectType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ type })
  },

  // 输入任务标题
  onTitleInput(e) {
    this.setData({ title: e.detail.value })
  },

  // 选择作物
  onCropChange(e) {
    const index = e.detail.value
    if (index > 0 && this.data.crops[index - 1]) {
      this.setData({ cropName: this.data.crops[index - 1].name })
    } else {
      this.setData({ cropName: '' })
    }
  },

  // 选择日期
  onDateChange(e) {
    this.setData({ dueDate: e.detail.value })
  },

  // 选择优先级
  selectPriority(e) {
    const priority = e.currentTarget.dataset.priority
    this.setData({ priority })
  },

  // 输入备注
  onNotesInput(e) {
    this.setData({ notes: e.detail.value })
  },

  // 提交表单
  submitForm() {
    const { title, type, cropName, dueDate, priority, notes } = this.data
    
    // 验证必填项
    if (!title.trim()) {
      wx.showToast({ title: '请输入任务标题', icon: 'none' })
      return
    }
    if (!dueDate) {
      wx.showToast({ title: '请选择截止日期', icon: 'none' })
      return
    }
    
    wx.showLoading({ title: '保存中...' })
    
    // 构建任务数据
    const taskData = {
      title: title.trim(),
      type: type,
      cropName: cropName || '未指定',
      dueDate: dueDate,
      priority: priority,
      status: 'pending',
      notes: notes,
      createdAt: new Date().toISOString().split('T')[0]
    }
    
    // 保存到云数据库
    db.collection('tasks').add({
      data: taskData
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

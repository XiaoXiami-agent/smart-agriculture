// 今日任务页面
const db = wx.cloud.database()

Page({
  data: {
    todayStr: '',
    weatherTip: '温度适宜，适合进行浇水、施肥等农事活动',
    pendingTasks: [],
    completedTasks: []
  },

  onLoad() {
    this.setToday()
    this.loadTasks()
  },

  onShow() {
    this.loadTasks()
  },

  // 设置今日日期
  setToday() {
    const today = new Date()
    const todayStr = today.getFullYear() + '年' + 
      (today.getMonth() + 1) + '月' + 
      today.getDate() + '日 ' + 
      ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][today.getDay()]
    this.setData({ todayStr })
  },

  // 加载任务
  loadTasks() {
    const today = new Date()
    const todayStr = today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0')

    // 任务类型映射
    const typeMap = {
      'irrigation': { icon: '💧', text: '灌溉' },
      'fertilization': { icon: '🧪', text: '施肥' },
      'weeding': { icon: '🌿', text: '除草' },
      'inspection': { icon: '🔍', text: '检查' }
    }

    // 优先级颜色
    const priorityMap = {
      'high': '#F44336',
      'medium': '#FF9800',
      'low': '#4CAF50'
    }

    // 从云数据库获取今日任务
    db.collection('tasks').where({
      dueDate: todayStr
    }).get().then(res => {
      const pending = []
      const completed = []

      res.data.forEach(task => {
        const typeInfo = typeMap[task.type] || { icon: '📋', text: task.type }
        const taskItem = {
          _id: task._id,
          title: task.title,
          cropName: task.cropName || '未指定作物',
          typeIcon: typeInfo.icon,
          typeText: typeInfo.text,
          priority: task.priority,
          priorityColor: priorityMap[task.priority] || '#4CAF50',
          status: task.status
        }

        if (task.status === 'completed') {
          completed.push(taskItem)
        } else {
          pending.push(taskItem)
        }
      })

      this.setData({
        pendingTasks: pending,
        completedTasks: completed
      })
    }).catch(err => {
      console.error('获取任务失败:', err)
    })
  },

  // 切换任务状态
  toggleTask(e) {
    const id = e.currentTarget.dataset.id
    const that = this

    // 更新到云数据库
    db.collection('tasks').doc(id).update({
      data: {
        status: 'completed'
      }
    }).then(res => {
      const pending = that.data.pendingTasks
      const taskIndex = pending.findIndex(t => t._id === id)

      if (taskIndex > -1) {
        const task = pending[taskIndex]
        task.status = 'completed'

        that.setData({
          pendingTasks: pending.filter(t => t._id !== id),
          completedTasks: [...that.data.completedTasks, task]
        })

        wx.showToast({ title: '任务完成', icon: 'success' })
      }
    }).catch(err => {
      console.error('更新任务状态失败:', err)
      wx.showToast({ title: '操作失败', icon: 'none' })
    })
  },

  // 删除任务
  deleteTask(e) {
    const id = e.currentTarget.dataset.id
    const that = this

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个任务吗？',
      success: (res) => {
        if (res.confirm) {
          db.collection('tasks').doc(id).remove().then(res => {
            that.setData({
              pendingTasks: that.data.pendingTasks.filter(t => t._id !== id),
              completedTasks: that.data.completedTasks.filter(t => t._id !== id)
            })
            wx.showToast({ title: '已删除', icon: 'success' })
          }).catch(err => {
            console.error('删除任务失败:', err)
            wx.showToast({ title: '删除失败', icon: 'none' })
          })
        }
      }
    })
  },

  // 添加任务
  addTask() {
    wx.navigateTo({
      url: '/pages/tasks/add/add'
    })
  }
})

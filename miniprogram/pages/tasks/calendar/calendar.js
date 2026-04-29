// 农事日历页面
const db = wx.cloud.database()

Page({
  data: {
    year: 0,
    month: 0,
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    calendarRows: [],
    selectedDate: '',
    dateTasks: [],
    taskDates: [] // 有任务的日期
  },

  onLoad() {
    this.initCalendar()
    this.loadTasks()
  },

  // 初始化日历
  initCalendar() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const today = now.getDate()
    
    this.setData({
      year,
      month,
      selectedDate: `${year}-${String(month).padStart(2, '0')}-${String(today).padStart(2, '0')}`
    })
    
    this.generateCalendar(year, month)
  },

  // 生成日历数据
  generateCalendar(year, month) {
    const firstDay = new Date(year, month - 1, 1).getDay()
    const daysInMonth = new Date(year, month, 0).getDate()
    const today = new Date().getDate()
    const todayMonth = new Date().getMonth() + 1
    const todayYear = new Date().getFullYear()
    
    const rows = []
    let cells = []
    let day = 1
    
    // 填充空白
    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: '', date: '' })
    }
    
    // 填充日期
    while (day <= daysInMonth) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const isToday = year === todayYear && month === todayMonth && day === today
      const hasTask = this.data.taskDates.includes(dateStr)
      
      cells.push({
        day,
        date: dateStr,
        today: isToday,
        hasTask
      })
      
      if (cells.length === 7) {
        rows.push(cells)
        cells = []
      }
      
      day++
    }
    
    // 填充剩余空白
    while (cells.length < 7 && cells.length > 0) {
      cells.push({ day: '', date: '' })
    }
    if (cells.length > 0) {
      rows.push(cells)
    }
    
    this.setData({ calendarRows: rows })
  },

  // 加载任务（从云数据库获取有任务的日期）
  loadTasks() {
    const { year, month } = this.data
    // 获取当月第一天和最后一天
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const lastDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    
    // 从云数据库获取当月所有任务
    db.collection('tasks').where({
      dueDate: db.command.gte(firstDay).and(db.command.lte(lastDate))
    }).field({
      dueDate: true
    }).get().then(res => {
      // 提取所有有任务的日期（去重）
      const taskDates = [...new Set(res.data.map(task => task.dueDate))]
      this.setData({ taskDates })
      this.generateCalendar(year, month)
    }).catch(err => {
      console.error('获取任务日期失败:', err)
      // 使用模拟数据作为后备
      const taskDates = [
        '2026-04-28',
        '2026-04-29',
        '2026-05-02',
        '2026-05-05'
      ]
      this.setData({ taskDates })
      this.generateCalendar(year, month)
    })
  },

  // 选择日期
  selectDate(e) {
    const date = e.currentTarget.dataset.date
    if (!date) return
    
    this.setData({ selectedDate: date })
    this.loadDateTasks(date)
  },

  // 加载日期任务（从云数据库获取）
  loadDateTasks(date) {
    // 任务类型映射
    const typeMap = {
      'irrigation': { icon: '💧', text: '浇水' },
      'fertilization': { icon: '🧪', text: '施肥' },
      'weeding': { icon: '🌿', text: '除草' },
      'inspection': { icon: '🔍', text: '检查' }
    }
    
    db.collection('tasks').where({
      dueDate: date
    }).get().then(res => {
      const tasks = res.data.map(task => {
        const typeInfo = typeMap[task.type] || { icon: '📋', text: task.type }
        return {
          _id: task._id,
          type: task.type,
          typeIcon: typeInfo.icon,
          title: task.title,
          cropName: task.cropName || '未指定',
          status: task.status
        }
      })
      this.setData({ dateTasks: tasks })
    }).catch(err => {
      console.error('获取日期任务失败:', err)
      this.setData({ dateTasks: [] })
    })
  },

  // 上一个月
  prevMonth() {
    let { year, month } = this.data
    if (month === 1) {
      year--
      month = 12
    } else {
      month--
    }
    this.setData({ year, month })
    this.loadTasks()
  },

  // 下一个月
  nextMonth() {
    let { year, month } = this.data
    if (month === 12) {
      year++
      month = 1
    } else {
      month++
    }
    this.setData({ year, month })
    this.loadTasks()
  }
})

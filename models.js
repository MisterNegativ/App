export const TaskStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  BLOCKED: 'blocked',
  COMPLETED: 'completed'
};

export const TaskAction = {
  CREATED: 'created',
  STATUS_CHANGED: 'status_changed',
  ASSIGNED: 'assigned'
};

export const TaskStructure = {
  title: '',
  description: '',
  startDate: null, 
  deadline: null, 
  status: TaskStatus.OPEN,
  employerId: '',
  employeeId: null,
  createdAt: null, 
  images: [],
  history: [],
  employerPhone: ''
};
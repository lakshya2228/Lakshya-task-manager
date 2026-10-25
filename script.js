(() => {
  'use strict';
  const STORAGE_KEY = 'focusflow.tasks.v1';
  const THEME_KEY = 'focusflow.theme.v1';
  let tasks = loadTasks();
  let currentFilter = 'all';
  let currentCategory = 'All';
  let editingId = null;
  let toastTimer;
  const $ = (id) => document.getElementById(id);
  const taskList = $('taskList');
  const modal = $('taskModal');
  const form = $('taskForm');
  const titleInput = $('taskTitle');
  const categoryInput = $('taskCategory');
  const dueInput = $('taskDue');

  function loadTasks() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed.filter(t => t && typeof t.id === 'string' && typeof t.title === 'string') : [];
    } catch (error) { console.warn('Could not read saved tasks:', error); return []; }
  }
  function saveTasks() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
    catch (error) { showToast('Could not save data in this browser.'); console.error(error); }
  }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function dateLabel(dateString) {
    if (!dateString) return 'No due date';
    const date = new Date(`${dateString}T12:00:00`);
    if (Number.isNaN(date.getTime())) return 'No due date';
    const today = new Date(); today.setHours(0,0,0,0);
    const target = new Date(date); target.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);
    let label = date.toLocaleDateString(undefined,{month:'short',day:'numeric',year:date.getFullYear()===today.getFullYear()?undefined:'numeric'});
    if (+target === +today) label = 'Today';
    else if (+target === +tomorrow) label = 'Tomorrow';
    return label;
  }
  function dueClass(task) {
    if (!task.dueDate || task.completed) return '';
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(`${task.dueDate}T00:00:00`);
    if (due < today) return 'overdue';
    if (+due === +today) return 'today';
    return '';
  }
  function filteredTasks() {
    const query = $('searchInput').value.trim().toLowerCase();
    let list = tasks.filter(task => {
      const matchesStatus = currentFilter === 'all' || (currentFilter === 'active' ? !task.completed : task.completed);
      const matchesCategory = currentCategory === 'All' || task.category === currentCategory;
      const matchesSearch = task.title.toLowerCase().includes(query) || task.category.toLowerCase().includes(query);
      return matchesStatus && matchesCategory && matchesSearch;
    });
    const sort = $('sortSelect').value;
    if (sort === 'due') list.sort((a,b) => (a.dueDate || '9999-99-99').localeCompare(b.dueDate || '9999-99-99'));
    else if (sort === 'title') list.sort((a,b) => a.title.localeCompare(b.title));
    else list.sort((a,b) => b.createdAt - a.createdAt);
    return list;
  }
  function render() {
    const total = tasks.length;
    const completed = tasks.filter(t=>t.completed).length;
    const active = total-completed;
    const percent = total ? Math.round(completed/total*100) : 0;
    $('allCount').textContent = total; $('activeCount').textContent = active; $('completedCount').textContent = completed;
    $('tabAll').textContent = total; $('tabActive').textContent = active; $('tabCompleted').textContent = completed;
    $('totalStat').textContent = total; $('activeStat').textContent = active; $('doneStat').textContent = completed; $('progressPercent').textContent = `${percent}%`;
    $('totalBar').style.width = `${total ? 100 : 0}%`;
    $('activeBar').style.width = `${total ? active/total*100 : 0}%`;
    $('doneBar').style.width = `${percent}%`;
    $('progressRing').style.background = `conic-gradient(#edaa4e ${percent*3.6}deg, #f3f1ed ${percent*3.6}deg)`;
    $('progressMessage').textContent = percent===100 && total ? 'Amazing work!' : percent>=60 ? 'Great momentum!' : percent>0 ? 'You are on a roll!' : 'Fresh start!';
    $('progressSub').textContent = total ? `${completed} of ${total} tasks completed.` : 'Every task is a new opportunity.';
    for (const category of ['All','Work','Personal','Study']) {
      const count = category==='All' ? total : tasks.filter(t=>t.category===category).length;
      const node = $(`cat${category}`); if(node) node.textContent=count;
    }
    document.querySelectorAll('[data-filter]').forEach(button => {
      button.classList.toggle('selected', button.classList.contains('filter-tab') && button.dataset.filter===currentFilter);
      button.classList.toggle('active', button.classList.contains('nav-item') && button.dataset.filter===currentFilter);
      if(button.classList.contains('filter-tab')) button.setAttribute('aria-pressed',String(button.dataset.filter===currentFilter));
    });
    document.querySelectorAll('[data-category]').forEach(button=>button.classList.toggle('selected',button.dataset.category===currentCategory));
    const list = filteredTasks();
    taskList.innerHTML = list.map(task => `
      <article class="task-row ${task.completed?'completed':''}" data-id="${escapeHTML(task.id)}">
        <button class="task-check" data-action="toggle" aria-label="${task.completed?'Mark active':'Mark completed'}: ${escapeHTML(task.title)}" aria-pressed="${task.completed}">${task.completed?'✓':''}</button>
        <div class="task-main"><div class="task-name">${escapeHTML(task.title)}</div><div class="task-meta"><span class="task-category ${task.category.toLowerCase()}"><span class="category-dot ${task.category.toLowerCase()}"></span>${escapeHTML(task.category)}</span><span class="task-due ${dueClass(task)}">▣ &nbsp;${escapeHTML(dateLabel(task.dueDate))}</span></div></div>
        <div class="task-actions"><button class="task-action" data-action="edit" aria-label="Edit ${escapeHTML(task.title)}" title="Edit task">✎</button><button class="task-action delete" data-action="delete" aria-label="Delete ${escapeHTML(task.title)}" title="Delete task">⌫</button></div>
      </article>`).join('');
    $('emptyState').classList.toggle('visible',list.length===0);
    taskList.style.display = list.length===0 ? 'none' : 'block';
    if (!total) { $('emptyTitle').textContent='A clean slate.'; $('emptyText').textContent='Add your first task and make today count.'; $('emptyAdd').style.display='inline-block'; }
    else if (!list.length) { $('emptyTitle').textContent='No tasks found'; $('emptyText').textContent='Try another filter or search term.'; $('emptyAdd').style.display='none'; }
    $('footerCount').textContent = `Showing ${list.length} of ${total} task${total===1?'':'s'}`;
  }
  function showToast(message) {
    const toast=$('toast'); toast.textContent=message; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove('show'),2400);
  }
  function openModal(task=null) {
    editingId = task ? task.id : null;
    $('modalTitle').textContent = task ? 'Edit task' : 'Create a task';
    $('submitLabel').textContent = task ? 'Save changes' : 'Create task';
    titleInput.value = task ? task.title : '';
    categoryInput.value = task ? task.category : 'Study';
    dueInput.value = task ? (task.dueDate || '') : '';
    modal.hidden = false; document.body.style.overflow='hidden';
    setTimeout(()=>titleInput.focus(),30);
  }
  function closeModal() { modal.hidden=true; document.body.style.overflow=''; editingId=null; form.reset(); }
  function makeId() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`; }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const title=titleInput.value.trim();
    if (!title) { titleInput.focus(); return; }
    if (editingId) {
      const task=tasks.find(t=>t.id===editingId);
      if(task){ task.title=title; task.category=categoryInput.value; task.dueDate=dueInput.value; showToast('Task updated successfully.'); }
    } else {
      tasks.unshift({id:makeId(),title,category:categoryInput.value,dueDate:dueInput.value,completed:false,createdAt:Date.now()});
      showToast('New task added. You got this!');
    }
    saveTasks(); closeModal(); render();
  });
  taskList.addEventListener('click', event => {
    const button=event.target.closest('[data-action]'); if(!button) return;
    const row=button.closest('[data-id]'); const task=tasks.find(t=>t.id===row?.dataset.id); if(!task) return;
    const action=button.dataset.action;
    if(action==='toggle'){task.completed=!task.completed;saveTasks();render();showToast(task.completed?'Task completed. Nice work!':'Task moved back to active.');}
    if(action==='edit') openModal(task);
    if(action==='delete') {
      if(window.confirm(`Delete "${task.title}"? This cannot be undone.`)) { tasks=tasks.filter(t=>t.id!==task.id);saveTasks();render();showToast('Task deleted.'); }
    }
  });
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{currentFilter=button.dataset.filter;render();}));
  document.querySelectorAll('[data-category]').forEach(button=>button.addEventListener('click',()=>{currentCategory=button.dataset.category;render();}));
  $('searchInput').addEventListener('input',render); $('sortSelect').addEventListener('change',render);
  $('addTaskTop').addEventListener('click',()=>openModal()); $('emptyAdd').addEventListener('click',()=>openModal());
  $('closeModal').addEventListener('click',closeModal); $('cancelModal').addEventListener('click',closeModal);
  modal.addEventListener('click',event=>{if(event.target===modal)closeModal();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!modal.hidden)closeModal();if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();$('searchInput').focus();}});
  $('themeToggle').addEventListener('click',()=>{document.body.classList.toggle('dark');const dark=document.body.classList.contains('dark');$('themeToggle').textContent=dark?'☀':'☾';try{localStorage.setItem(THEME_KEY,dark?'dark':'light');}catch(_){} });
  try { if(localStorage.getItem(THEME_KEY)==='dark'){document.body.classList.add('dark');$('themeToggle').textContent='☀';} } catch(_){}
  const now=new Date(); $('dayName').textContent=now.toLocaleDateString(undefined,{weekday:'long'}).toUpperCase(); $('fullDate').textContent=now.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
  render();
})();

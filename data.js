(function (global) {
  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function toISODate(date) {
    return (
      date.getFullYear() +
      '-' +
      pad2(date.getMonth() + 1) +
      '-' +
      pad2(date.getDate())
    );
  }

  function offsetISO(daysFromToday) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + daysFromToday);
    return toISODate(d);
  }

  function offsetMonthDay(daysFromToday) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + daysFromToday);
    return pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  const ONBOARDING_TEMPLATES = {
    standard: [
      { stage: 'День 1', title: 'Выдать почту, корпоративный мессенджер и доступы в Notion', owner: 'HR' },
      { stage: 'День 1', title: 'Провести вводный звонок с бадди и рассказать о процессах', owner: 'Бадди' },
      { stage: 'День 1', title: 'Подписать кадровые документы и заполнить профиль', owner: 'HR' },
      { stage: 'Первая неделя', title: 'Вводная встреча по продукту и ключевым метрикам', owner: 'Тимлид' },
      { stage: 'Первая неделя', title: 'Провести знакомства со смежными командами', owner: 'Новичок' },
      { stage: 'Первая неделя', title: 'Закрыть первую рабочую задачу при поддержке бадди', owner: 'Новичок' },
      { stage: 'Первый месяц', title: 'Зафиксировать цели на испытательный срок (3 мес.)', owner: 'Тимлид' },
      { stage: 'Первый месяц', title: 'Промежуточный 1-on-1 чек-ин после двух недель', owner: 'HR' },
      { stage: 'Первый месяц', title: 'Итоги первого месяца и обратная связь', owner: 'Тимлид' }
    ],
    tech: [
      { stage: 'День 1', title: 'Выдать доступы в GitHub, трекер задач, VPN и стенды', owner: 'Тимлид' },
      { stage: 'День 1', title: 'Выдать технику и оформить кадровые документы', owner: 'HR' },
      { stage: 'День 1', title: 'Настроить локальное окружение и запустить проект', owner: 'Бадди' },
      { stage: 'Первая неделя', title: 'Разобрать архитектуру сервисов и правила код-ревью', owner: 'Бадди' },
      { stage: 'Первая неделя', title: 'Выкатить первую небольшую задачу на staging', owner: 'Новичок' },
      { stage: 'Первая неделя', title: 'Поучаствовать в планировании и демо спринта', owner: 'Новичок' },
      { stage: 'Первый месяц', title: 'Провести первое самостоятельное код-ревью', owner: 'Новичок' },
      { stage: 'Первый месяц', title: 'Согласовать цели на испытательный срок', owner: 'Тимлид' },
      { stage: 'Первый месяц', title: 'Чек-ин первого месяца с HR и руководителем', owner: 'HR' }
    ]
  };

  function buildDefaultData() {
    return {
      departments: [
        {
          id: 'exec',
          name: 'Руководство',
          color: '#374151',
          leadId: 'emp-1',
          openRoles: 0,
          description: 'Стратегия компании, партнёрства и ключевые решения'
        },
        {
          id: 'eng',
          name: 'Разработка',
          color: '#2563EB',
          leadId: 'emp-2',
          openRoles: 2,
          description: 'Frontend, Backend, DevOps и тестирование'
        },
        {
          id: 'product',
          name: 'Продукт и дизайн',
          color: '#7C3AED',
          leadId: 'emp-6',
          openRoles: 1,
          description: 'Продуктовый менеджмент, UX/UI и аналитика'
        },
        {
          id: 'marketing',
          name: 'Маркетинг',
          color: '#059669',
          leadId: 'emp-9',
          openRoles: 1,
          description: 'Привлечение, контент и бренд работодателя'
        },
        {
          id: 'people',
          name: 'HR и операции',
          color: '#D97706',
          leadId: 'emp-12',
          openRoles: 0,
          description: 'Рекрутинг, онбординг, КДП и операционная поддержка'
        }
      ],

      employees: [
        {
          id: 'emp-1',
          name: 'Алексей Морозов',
          role: 'Генеральный директор (CEO)',
          departmentId: 'exec',
          managerId: null,
          status: 'active',
          format: 'Офис',
          city: 'Москва',
          timezone: 'МСК',
          email: 'a.morozov@avroratech.ru',
          telegram: '@amorozov',
          phone: '+7 (916) 412-08-10',
          startDate: '2021-03-15',
          birthday: '05-19',
          vacationTotal: 28,
          vacationUsed: 14
        },
        {
          id: 'emp-2',
          name: 'Игорь Соколов',
          role: 'CTO / Руководитель разработки',
          departmentId: 'eng',
          managerId: 'emp-1',
          status: 'active',
          format: 'Гибрид',
          city: 'Москва',
          timezone: 'МСК',
          email: 'i.sokolov@avroratech.ru',
          telegram: '@isokolov',
          phone: '+7 (926) 530-19-44',
          startDate: '2021-06-01',
          birthday: offsetMonthDay(10),
          vacationTotal: 28,
          vacationUsed: 10
        },
        {
          id: 'emp-3',
          name: 'Мария Белова',
          role: 'Senior Frontend Engineer',
          departmentId: 'eng',
          managerId: 'emp-2',
          status: 'active',
          format: 'Удалённо',
          city: 'Санкт-Петербург',
          timezone: 'МСК',
          email: 'm.belova@avroratech.ru',
          telegram: '@mbelova',
          phone: '+7 (921) 884-12-03',
          startDate: '2022-09-12',
          birthday: '08-22',
          vacationTotal: 28,
          vacationUsed: 14
        },
        {
          id: 'emp-4',
          name: 'Артём Кузнецов',
          role: 'Backend Engineer (Go)',
          departmentId: 'eng',
          managerId: 'emp-2',
          status: 'active',
          format: 'Гибрид',
          city: 'Москва',
          timezone: 'МСК',
          email: 'a.kuznetsov@avroratech.ru',
          telegram: '@akuznetsov',
          phone: '+7 (903) 715-66-92',
          startDate: '2023-04-10',
          birthday: '02-14',
          vacationTotal: 28,
          vacationUsed: 7
        },
        {
          id: 'emp-5',
          name: 'Егор Тихонов',
          role: 'QA Engineer',
          departmentId: 'eng',
          managerId: 'emp-2',
          status: 'probation',
          format: 'Удалённо',
          city: 'Казань',
          timezone: 'МСК',
          email: 'e.tikhonov@avroratech.ru',
          telegram: '@etikhonov',
          phone: '+7 (917) 301-44-58',
          startDate: offsetISO(-9),
          birthday: '10-03',
          vacationTotal: 28,
          vacationUsed: 0
        },
        {
          id: 'emp-14',
          name: 'Никита Зайцев',
          role: 'DevOps Engineer',
          departmentId: 'eng',
          managerId: 'emp-2',
          status: 'active',
          format: 'Удалённо',
          city: 'Екатеринбург',
          timezone: 'МСК+2',
          email: 'n.zaitsev@avroratech.ru',
          telegram: '@nzaitsev',
          phone: '+7 (912) 602-88-11',
          startDate: '2024-02-05',
          birthday: '06-11',
          vacationTotal: 28,
          vacationUsed: 14
        },
        {
          id: 'emp-6',
          name: 'Елена Смирнова',
          role: 'Head of Product & Design',
          departmentId: 'product',
          managerId: 'emp-1',
          status: 'active',
          format: 'Гибрид',
          city: 'Москва',
          timezone: 'МСК',
          email: 'e.smirnova@avroratech.ru',
          telegram: '@esmirnova',
          phone: '+7 (915) 204-77-19',
          startDate: '2022-01-17',
          birthday: '09-27',
          vacationTotal: 28,
          vacationUsed: 14
        },
        {
          id: 'emp-7',
          name: 'Ксения Орлова',
          role: 'Senior Product Designer',
          departmentId: 'product',
          managerId: 'emp-6',
          status: 'active',
          format: 'Удалённо',
          city: 'Санкт-Петербург',
          timezone: 'МСК',
          email: 'k.orlova@avroratech.ru',
          telegram: '@korlova',
          phone: '+7 (981) 745-31-90',
          startDate: '2023-08-21',
          birthday: offsetMonthDay(2),
          vacationTotal: 28,
          vacationUsed: 7
        },
        {
          id: 'emp-8',
          name: 'Тимур Сафин',
          role: 'Product Analyst',
          departmentId: 'product',
          managerId: 'emp-6',
          status: 'probation',
          format: 'Удалённо',
          city: 'Новосибирск',
          timezone: 'МСК+4',
          email: 't.safin@avroratech.ru',
          telegram: '@tsafin',
          phone: '+7 (913) 901-55-24',
          startDate: offsetISO(-2),
          birthday: '03-30',
          vacationTotal: 28,
          vacationUsed: 0
        },
        {
          id: 'emp-9',
          name: 'Ольга Новикова',
          role: 'Директор по маркетингу (CMO)',
          departmentId: 'marketing',
          managerId: 'emp-1',
          status: 'active',
          format: 'Офис',
          city: 'Москва',
          timezone: 'МСК',
          email: 'o.novikova@avroratech.ru',
          telegram: '@onovikova',
          phone: '+7 (916) 890-14-35',
          startDate: '2022-05-11',
          birthday: '07-04',
          vacationTotal: 28,
          vacationUsed: 12
        },
        {
          id: 'emp-10',
          name: 'Дарья Лебедева',
          role: 'Content & Brand Manager',
          departmentId: 'marketing',
          managerId: 'emp-9',
          status: 'active',
          format: 'Гибрид',
          city: 'Москва',
          timezone: 'МСК',
          email: 'd.lebedeva@avroratech.ru',
          telegram: '@dlebedeva',
          phone: '+7 (925) 337-20-61',
          startDate: '2024-07-08',
          birthday: offsetMonthDay(5),
          vacationTotal: 28,
          vacationUsed: 7
        },
        {
          id: 'emp-11',
          name: 'Сергей Попов',
          role: 'Performance Marketer',
          departmentId: 'marketing',
          managerId: 'emp-9',
          status: 'probation',
          format: 'Удалённо',
          city: 'Краснодар',
          timezone: 'МСК',
          email: 's.popov@avroratech.ru',
          telegram: '@spopov',
          phone: '+7 (918) 442-09-73',
          startDate: offsetISO(-23),
          birthday: '01-18',
          vacationTotal: 28,
          vacationUsed: 0
        },
        {
          id: 'emp-12',
          name: 'Анна Ковалёва',
          role: 'HR-директор',
          departmentId: 'people',
          managerId: 'emp-1',
          status: 'active',
          format: 'Гибрид',
          city: 'Москва',
          timezone: 'МСК',
          email: 'a.kovaleva@avroratech.ru',
          telegram: '@akovaleva',
          phone: '+7 (916) 501-92-18',
          startDate: '2021-11-08',
          birthday: '04-12',
          vacationTotal: 28,
          vacationUsed: 14
        },
        {
          id: 'emp-13',
          name: 'Полина Громова',
          role: 'IT Recruiter & HRBP',
          departmentId: 'people',
          managerId: 'emp-12',
          status: 'active',
          format: 'Гибрид',
          city: 'Москва',
          timezone: 'МСК',
          email: 'p.gromova@avroratech.ru',
          telegram: '@pgromova',
          phone: '+7 (926) 711-04-82',
          startDate: '2023-10-02',
          birthday: '12-09',
          vacationTotal: 28,
          vacationUsed: 10
        }
      ],

      onboarding: [
        {
          id: 'onb-1',
          employeeId: 'emp-8',
          buddyId: 'emp-6',
          startedAt: offsetISO(-2),
          tasks: [
            { id: 't-101', stage: 'День 1', title: 'Выдать доступы в корпоративную почту, Notion, Amplitude и Metabase', owner: 'HR', done: true },
            { id: 't-102', stage: 'День 1', title: 'Провести вводный звонок и рассказать о процессах команды', owner: 'Бадди', done: true },
            { id: 't-103', stage: 'День 1', title: 'Оформить кадровые документы и заполнить карточку сотрудника', owner: 'HR', done: true },
            { id: 't-104', stage: 'Первая неделя', title: 'Разобрать продуктовую воронку и ключевые дашборды', owner: 'Бадди', done: true },
            { id: 't-105', stage: 'Первая неделя', title: 'Познакомиться с продакт-дизайнером и техлидом разработки', owner: 'Новичок', done: false },
            { id: 't-106', stage: 'Первая неделя', title: 'Собрать первый отчёт по активации новых команд', owner: 'Новичок', done: false },
            { id: 't-107', stage: 'Первый месяц', title: 'Согласовать цели на испытательный срок (3 месяца)', owner: 'Тимлид', done: false },
            { id: 't-108', stage: 'Первый месяц', title: 'Пройти чек-ин второй недели с HRBP', owner: 'HR', done: false }
          ]
        },
        {
          id: 'onb-2',
          employeeId: 'emp-5',
          buddyId: 'emp-3',
          startedAt: offsetISO(-9),
          tasks: [
            { id: 't-201', stage: 'День 1', title: 'Выдать доступы в GitHub, трекер задач, VPN и стенды', owner: 'Тимлид', done: true },
            { id: 't-202', stage: 'День 1', title: 'Провести welcome-встречу с HR и подключить к чатам', owner: 'HR', done: true },
            { id: 't-203', stage: 'День 1', title: 'Настроить локальное окружение и автотесты Playwright', owner: 'Бадди', done: true },
            { id: 't-204', stage: 'Первая неделя', title: 'Изучить матрицу регресса и правила заведения баг-репортов', owner: 'Бадди', done: true },
            { id: 't-205', stage: 'Первая неделя', title: 'Провести первое тестирование релиза на staging', owner: 'Новичок', done: true },
            { id: 't-206', stage: 'Первая неделя', title: 'Поучаствовать в командном груминге и демо спринта', owner: 'Новичок', done: true },
            { id: 't-207', stage: 'Первый месяц', title: 'Написать 5 автотестов для модуля отпусков', owner: 'Новичок', done: false },
            { id: 't-208', stage: 'Первый месяц', title: 'Утвердить план развития на 3 месяца с CTO', owner: 'Тимлид', done: false },
            { id: 't-209', stage: 'Первый месяц', title: 'Провести встречу обратной связи 2-й недели с HR', owner: 'HR', done: false }
          ]
        },
        {
          id: 'onb-3',
          employeeId: 'emp-11',
          buddyId: 'emp-10',
          startedAt: offsetISO(-23),
          tasks: [
            { id: 't-301', stage: 'День 1', title: 'Выдать доступы к рекламным кабинетам, CRM и аналитике', owner: 'HR', done: true },
            { id: 't-302', stage: 'День 1', title: 'Провести обзор позиционирования и целевой аудитории', owner: 'Бадди', done: true },
            { id: 't-303', stage: 'Первая неделя', title: 'Провести аудит текущих кампаний и стоимости лида', owner: 'Новичок', done: true },
            { id: 't-304', stage: 'Первая неделя', title: 'Согласовать гипотезы A/B-тестов с отделом продукта', owner: 'Тимлид', done: true },
            { id: 't-305', stage: 'Первый месяц', title: 'Запустить 3 новые тестовые кампании', owner: 'Новичок', done: true },
            { id: 't-306', stage: 'Первый месяц', title: 'Презентовать результаты первого месяца на встрече маркетинга', owner: 'Новичок', done: true },
            { id: 't-307', stage: 'Первый месяц', title: 'Подвести итоги первого месяца с CMO и HR', owner: 'Тимлид', done: false }
          ]
        },
        {
          id: 'onb-4',
          employeeId: 'emp-10',
          buddyId: 'emp-9',
          startedAt: '2024-07-08',
          tasks: [
            { id: 't-401', stage: 'День 1', title: 'Настроить рабочее место и доступы к Notion, Figma', owner: 'HR', done: true },
            { id: 't-402', stage: 'Первая неделя', title: 'Изучить редполитику и стиль коммуникаций бренда', owner: 'Бадди', done: true },
            { id: 't-403', stage: 'Первый месяц', title: 'Выпустить первые 4 кейса с клиентами компании', owner: 'Новичок', done: true }
          ]
        }
      ],

      leaves: [
        {
          id: 'lv-1',
          employeeId: 'emp-4',
          type: 'vacation',
          startDate: offsetISO(-2),
          endDate: offsetISO(4),
          status: 'approved',
          comment: 'Осенний отпуск, сервисы под присмотром Никиты'
        },
        {
          id: 'lv-2',
          employeeId: 'emp-13',
          type: 'dayoff',
          startDate: offsetISO(0),
          endDate: offsetISO(0),
          status: 'approved',
          comment: 'Личный день, на связи в Telegram'
        },
        {
          id: 'lv-3',
          employeeId: 'emp-7',
          type: 'vacation',
          startDate: offsetISO(6),
          endDate: offsetISO(10),
          status: 'pending',
          comment: 'Отпуск после финализации макетов нового модуля'
        },
        {
          id: 'lv-4',
          employeeId: 'emp-3',
          type: 'vacation',
          startDate: offsetISO(1),
          endDate: offsetISO(5),
          status: 'pending',
          comment: 'Поездка к семье, ревью передала Игорю'
        },
        {
          id: 'lv-5',
          employeeId: 'emp-14',
          type: 'dayoff',
          startDate: offsetISO(2),
          endDate: offsetISO(2),
          status: 'pending',
          comment: 'Один день по семейным делам'
        },
        {
          id: 'lv-6',
          employeeId: 'emp-6',
          type: 'vacation',
          startDate: offsetISO(21),
          endDate: offsetISO(28),
          status: 'approved',
          comment: 'Плановый отпуск в конце года'
        },
        {
          id: 'lv-7',
          employeeId: 'emp-9',
          type: 'sick',
          startDate: offsetISO(-11),
          endDate: offsetISO(-8),
          status: 'approved',
          comment: 'Больничный, лист передан в бухгалтерию'
        },
        {
          id: 'lv-8',
          employeeId: 'emp-10',
          type: 'vacation',
          startDate: offsetISO(15),
          endDate: offsetISO(21),
          status: 'approved',
          comment: 'Контент-план на декабрь подготовлен заранее'
        }
      ]
    };
  }

  global.HR_SEED = {
    ONBOARDING_TEMPLATES: ONBOARDING_TEMPLATES,
    buildDefaultData: buildDefaultData,
    toISODate: toISODate,
    offsetISO: offsetISO
  };
})(window);

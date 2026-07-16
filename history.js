(function () {
    'use strict';

    // Защита от дублей
    if (window.lampa_history_resume_v1) return;
    window.lampa_history_resume_v1 = true;

    console.log('History Resume', 'Запуск плагина "Продолжить просмотр"');

    // Флаги для цепочки авто-кликов
    window.lampa_auto_resume_id = null;
    window.lampa_auto_resume_menu = false;

    // 1. Создаем полку и встраиваем её на главный экран
    Lampa.Listener.follow('activity', function (e) {
        // Ждем полную отрисовку главного экрана
        if (e.type === 'complite' && e.component === 'main') {
            let history = Lampa.Favorite.get('history') || [];
            if (history.length === 0) return;

            // Берем последние 15 просмотренных тайтлов
            let items = history.slice(0, 15);

            // Создаем стандартную полку Лампы
            let line = new Lampa.Line(items, {
                title: 'Продолжить просмотр',
                object: { source: 'history' } 
            });

            line.create();

            // Перехватываем клик пульта по карточкам именно в ЭТОЙ полке
            line.onAppend = function () {
                line.render().find('.card').off('hover:enter').on('hover:enter', function () {
                    let idx = $(this).index();
                    let item = items[idx];
                    
                    // Взводим курки автокликера
                    window.lampa_auto_resume_id = item.id;
                    window.lampa_auto_resume_menu = true;

                    // Нативно открываем карточку
                    Lampa.Activity.push({
                        url: '',
                        component: 'full',
                        id: item.id,
                        method: item.name ? 'tv' : 'movie',
                        card: item
                    });
                });
            };

            // Внедряем полку в самый верх (над "Сейчас смотрят")
            let scroll_body = e.object.activity.render().find('.scroll__body');
            scroll_body.prepend(line.render());

            // Прописываем полку во внутренние массивы Лампы, чтобы пульт мог на неё зайти
            if (e.object.activity.lines) {
                e.object.activity.lines.unshift(line);
            }
            if (e.object.activity.children) {
                e.object.activity.children.unshift(line);
            }
        }
    });

    // 2. Авто-клик по кнопке "Смотреть" при открытии карточки
    Lampa.Listener.follow('full', function (e) {
        if (e.type === 'complite') {
            if (window.lampa_auto_resume_id && e.object.activity.card.id === window.lampa_auto_resume_id) {
                window.lampa_auto_resume_id = null; // Сбрасываем первый флаг
                
                let attempts = 0;
                let tryClick = setInterval(() => {
                    attempts++;
                    let render = e.object.activity.render();
                    
                    // Ищем родную кнопку "Смотреть" или кнопку балансера
                    let btn = render.find('.button--play, .view--online').first();
                    
                    if (btn.length) {
                        clearInterval(tryClick);
                        // Имитируем нажатие "ОК" на пульте
                        btn.trigger('hover:enter');
                    } else if (attempts > 20) { 
                        // Если балансеры так и не прогрузились за 2 секунды - отмена
                        clearInterval(tryClick);
                        window.lampa_auto_resume_menu = false;
                    }
                }, 100);
            }
        }
    });

    // 3. Авто-клик в всплывающем меню балансеров (выбор "Продолжить")
    if (Lampa.Select && Lampa.Select.show) {
        const origSelect = Lampa.Select.show;
        
        Lampa.Select.show = function (options) {
            if (window.lampa_auto_resume_menu) {
                window.lampa_auto_resume_menu = false; // Сбрасываем второй флаг

                if (options && options.items && options.items.length > 0) {
                    let target = options.items[0]; // По умолчанию бьем в первый пункт (обычно это последний балансер)
                    
                    // Ищем пункт со словом "Продолжить", если балансер его создал
                    for (let i = 0; i < options.items.length; i++) {
                        let title = (options.items[i].title || '').toLowerCase();
                        if (title.includes('продолжить') || title.includes('continue')) {
                            target = options.items[i];
                            break;
                        }
                    }

                    // Кликаем с микро-задержкой, чтобы меню успело отрисоваться
                    setTimeout(() => {
                        if (target.btn) $(target.btn).trigger('hover:enter');
                    }, 50);
                }
            }
            // Вызываем оригинальное меню
            return origSelect.call(this, options);
        };
    }

})();
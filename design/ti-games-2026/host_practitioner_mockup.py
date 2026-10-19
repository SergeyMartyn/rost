"""Additional R.O.S.T. Penpot concepts: compact purchase, practitioner, host path."""

from mockup import Svg, GREEN, GOLD, BG, PALE, MUTED, LINE, WHITE, header, PAGE_GUTTER


def compact_ticket(s, x, y, w):
    s.rect(x, y, w, 490, WHITE, 28, LINE)
    s.rect(x, y, w, 116, PALE, 28)
    s.rect(x, y + 86, w, 30, PALE)
    s.text(x + 22, y + 30, "КОГДА", 11, GREEN, weight=700, letter=1.5)
    s.text(x + 22, y + 77, "7 ноября 2026", 29, GREEN, "Marmelad, Georgia, serif")
    s.text(x + 22, y + 143, "Мюнхен · Perchtinger Straße 12", 12, MUTED)
    s.text(x + 22, y + 178, "Выберите билет участника", 15, GREEN, weight=700)
    options = [
        ("Базовый импульс", "Игры · общие зоны · напитки · фото", "80 €", False),
        ("Пик трансформации", "Всё выше + Zoom, ужин, консультация", "180 €", True),
    ]
    for i, (name, detail, price, selected) in enumerate(options):
        oy = y + 194 + i * 80
        s.rect(x + 18, oy, w - 36, 72, BG if selected else WHITE, 16, GREEN if selected else LINE, 2 if selected else 1)
        s.circle(x + 40, oy + 27, 7, WHITE, GREEN if selected else LINE, 2)
        if selected:
            s.circle(x + 40, oy + 27, 3.5, GREEN)
        s.text(x + 55, oy + 31, name, 15, GREEN, weight=700)
        s.text(x + w - 28, oy + 31, price, 21, GREEN, "Marmelad, Georgia, serif", anchor="end")
        s.text(x + 55, oy + 56, detail, 11, MUTED)
    s.button(x + 18, y + 358, w - 36, "Купить билет участника", 52)
    hy = y + 420
    s.rect(x + 18, hy, w - 36, 48, WHITE, 15, LINE)
    s.text(x + 35, hy + 30, "Хочу провести игру", 14, GREEN, weight=700)
    s.text(x + w - 36, hy + 30, "↗", 20, GREEN, anchor="end")


def purchase_desktop():
    s = Svg(1440, 760)
    s.rect(0, 0, 1440, 760, BG)
    header(s, 1440, PAGE_GUTTER["desktop"])
    s.text(120, 140, "МЕРОПРИЯТИЯ / ТРАНСФОРМАЦИОННЫЕ ИГРЫ", 12, GREEN, weight=700, letter=1.4)
    s.pill(120, 170, 215, "7 НОЯБРЯ · МЮНХЕН", GOLD, GREEN)
    s.text(120, 265, ["День", "трансформационных", "игр в Мюнхене"], 59, GREEN, "Marmelad, Georgia, serif", leading=1.07)
    s.line(120, 492, 480, 492, GOLD, 5)
    s.text(120, 544, ["Две игровые линейки и живое общение.", "Выберите билет и познакомьтесь с ведущими."], 19, MUTED, leading=1.5)
    compact_ticket(s, 962, 116, 358)
    s.save("TI-games-ticket-v2-desktop.svg")


def purchase_mobile():
    s = Svg(390, 690)
    s.rect(0, 0, 390, 690, BG)
    header(s, 390, 16, True)
    s.text(20, 112, "МЕРОПРИЯТИЯ / ИГРЫ", 11, GREEN, weight=700, letter=1.3)
    compact_ticket(s, 20, 148, 350)
    s.save("TI-games-ticket-v2-mobile.svg")


def practitioner_desktop():
    s = Svg(1440, 900)
    s.rect(0, 0, 1440, 900, BG)
    header(s, 1440, PAGE_GUTTER["desktop"])
    s.text(120, 145, "ИГРОПРАКТИКИ", 12, GREEN, weight=700, letter=1.6)
    s.text(120, 210, "С кем можно сыграть", 45, GREEN, "Marmelad, Georgia, serif")
    for i, (name, photo) in enumerate([("Кристина Бауэр", "Speaker5-thumb.png"), ("Катарина Базаль", "Katharina-thumb.png"), ("Елена Гельмель", "LenaGelmel-thumb.png"), ("Зинаида Ланглитц", "Zinaida1-thumb.png"), ("Алла Афанасенко", "Alla_Afanasenko-thumb.png")]):
        x = 120 + i * 245
        s.circle(x + 85, 365, 75, WHITE)
        s.image_circle(x + 85, 365, 70, photo)
        s.text(x + 85, 478, name, 15, GREEN, weight=700, anchor="middle")
    s.rect(0, 0, 1440, 900, GREEN, opacity=.55)
    s.rect(200, 86, 1040, 728, WHITE, 30)
    s.text(245, 137, "ИГРОПРАКТИК · 1 ИЗ 5", 12, GREEN, weight=700, letter=1.6)
    s.circle(1187, 125, 22, WHITE, GREEN)
    s.text(1187, 132, "×", 23, GREEN, anchor="middle")
    s.circle(399, 324, 151, BG)
    s.image_circle(399, 324, 145, "Speaker5.png")
    s.text(245, 568, "Другие ведущие", 15, GREEN, weight=700)
    s.text(245, 612, "←    Катарина   ·   Елена   ·   Зинаида   ·   Алла", 13, MUTED)
    s.text(614, 211, "Кристина Бауэр", 40, GREEN, "Marmelad, Georgia, serif")
    s.text(614, 248, "Неопсихолог, коуч и тренер эмоциональных состояний", 15, MUTED)
    s.line(614, 277, 1166, 277, GOLD, 3)
    s.text(614, 315, "ИГРА · AINSOF", 12, GREEN, weight=700, letter=1.3)
    s.text(614, 359, ["Для тех, кто хочет увидеть новые", "возможности и двигаться к цели."], 20, GREEN, "Marmelad, Georgia, serif")
    s.text(614, 448, ["На встрече можно исследовать свой запрос,", "заметить ограничения и найти ресурсы", "для следующего шага."], 16, MUTED, leading=1.65)
    s.rect(614, 569, 550, 90, BG, 18)
    s.text(638, 604, "Подойдёт, если вы ищете ясность и мотивацию", 15, GREEN, weight=700)
    s.text(638, 632, "Опыт игры не требуется", 13, MUTED)
    s.text(614, 738, "←  Все игропрактики", 14, GREEN, weight=700)
    s.save("TI-games-practitioner-overlay-desktop.svg")


def practitioner_mobile():
    s = Svg(390, 844)
    s.rect(0, 0, 390, 844, WHITE)
    s.text(20, 45, "ИГРОПРАКТИК · 1 ИЗ 5", 11, GREEN, weight=700, letter=1.3)
    s.circle(353, 36, 20, WHITE, GREEN)
    s.text(353, 43, "×", 22, GREEN, anchor="middle")
    s.circle(195, 187, 111, BG)
    s.image_circle(195, 187, 106, "Speaker5.png")
    s.text(20, 354, "Кристина Бауэр", 34, GREEN, "Marmelad, Georgia, serif")
    s.text(20, 390, ["Неопсихолог, коуч и тренер", "эмоциональных состояний"], 14, MUTED, leading=1.5)
    s.line(20, 445, 370, 445, GOLD, 3)
    s.text(20, 483, "ИГРА · AINSOF", 11, GREEN, weight=700, letter=1.3)
    s.text(20, 526, ["Увидеть возможности", "и найти следующий шаг"], 24, GREEN, "Marmelad, Georgia, serif", leading=1.15)
    s.text(20, 613, ["Игра поможет исследовать свой запрос,", "заметить ограничения и найти ресурсы", "для движения к цели."], 14, MUTED, leading=1.55)
    s.rect(20, 707, 350, 64, BG, 16)
    s.text(36, 734, "Подойдёт, если вам нужна ясность", 13, GREEN, weight=700)
    s.text(36, 754, "Опыт игры не требуется", 12, MUTED)
    s.text(195, 818, "←   Все ведущие   →", 13, GREEN, weight=700, anchor="middle")
    s.save("TI-games-practitioner-overlay-mobile.svg")


def host_desktop():
    s = Svg(1440, 2500)
    s.rect(0, 0, 1440, 700, BG)
    header(s, 1440, PAGE_GUTTER["desktop"])
    s.text(120, 142, "МЕРОПРИЯТИЯ / ДЛЯ ВЕДУЩИХ", 12, GREEN, weight=700, letter=1.5)
    s.pill(120, 174, 206, "7 НОЯБРЯ · МЮНХЕН", GOLD, GREEN)
    s.text(120, 282, ["Проведите свою игру", "на встрече R.O.S.T."], 58, GREEN, "Marmelad, Georgia, serif", leading=1.08)
    s.text(120, 442, ["Две игровые линейки, знакомство с участниками", "и поддержка команды на каждом этапе."], 20, MUTED, leading=1.5)
    s.button(120, 552, 370, "Зарегистрироваться и занять стол", 60)
    s.text(120, 646, "7 столов для ведущих · бронирование на 30 минут", 14, MUTED)
    s.rect(914, 146, 406, 438, PALE, 30)
    s.image_circle(1117, 350, 173, "Speaker5.png")
    s.rect(0, 700, 1440, 525, WHITE)
    s.text(120, 795, "ФОРМАТ", 12, GREEN, weight=700, letter=1.5)
    s.text(120, 856, "Ваша игра — в центре дня", 44, GREEN, "Marmelad, Georgia, serif")
    for i, (title, body) in enumerate([
        ("Две игровые линейки", "Проведите две сессии по два часа."),
        ("Знакомство со всеми", "Коротко представьте себя и свою игру."),
        ("Поддержка команды", "Пространство, координация и продвижение."),
        ("Профиль на сайте", "Участники смогут узнать о вас заранее."),
    ]):
        x = 120 + (i % 2) * 610
        y = 920 + (i // 2) * 126
        s.rect(x, y, 580, 106, BG, 20)
        s.text(x + 24, y + 42, title, 20, GREEN, "Marmelad, Georgia, serif")
        s.text(x + 24, y + 75, body, 15, MUTED)
    s.rect(0, 1225, 1440, 785, BG)
    s.text(120, 1320, "УСЛОВИЯ", 12, GREEN, weight=700, letter=1.5)
    s.text(120, 1387, "Выберите формат участия", 44, GREEN, "Marmelad, Georgia, serif")
    for i, (x, title, price, desc, note) in enumerate([
        (120, "Стандартное участие", "249 €", "Две игры, профиль, самопрезентация, продвижение и сертификат.", "Приглашение в ваших соцсетях раз в неделю."),
        (730, "Расширенное участие", "349 €", "Всё из стандартного формата и дополнительное продвижение R.O.S.T.", "Можно сосредоточиться на подготовке игры."),
    ]):
        s.rect(x, 1440, 590, 264, BG if i == 0 else WHITE, 24, GREEN if i == 0 else LINE, 2 if i == 0 else 1)
        s.circle(x + 36, 1483, 10, WHITE, GREEN if i == 0 else LINE, 2)
        if i == 0:
            s.circle(x + 36, 1483, 5, GREEN)
        s.text(x + 58, 1491, title, 24, GREEN, weight=700)
        s.text(x + 555, 1491, price, 29, GREEN, "Marmelad, Georgia, serif", anchor="end")
        s.text(x + 58, 1543, desc, 15, MUTED)
        s.line(x + 28, 1582, x + 555, 1582)
        s.text(x + 28, 1631, note, 14, GREEN)
    s.rect(120, 1732, 1200, 90, WHITE, 18, LINE)
    s.rect(145, 1763, 22, 22, WHITE, 5, GREEN, 2)
    s.text(184, 1769, "Добавить фото и видео", 20, GREEN, weight=700)
    s.text(1290, 1769, "+79 €", 22, GREEN, "Marmelad, Georgia, serif", anchor="end")
    s.text(184, 1800, "10 профессиональных фотографий и один рилс", 14, MUTED)
    s.rect(120, 1840, 1200, 80, WHITE, 18, LINE)
    s.rect(145, 1868, 22, 22, WHITE, 5, GREEN, 2)
    s.text(184, 1875, "Внести предоплату 50 €", 20, GREEN, weight=700)
    s.text(184, 1902, "Отметьте, чтобы сейчас оплатить 50 € вместо полной стоимости.", 14, MUTED)
    s.text(120, 1964, "Стоимость участия: 249 €", 20, GREEN, weight=700)
    s.text(1320, 1964, "К оплате сейчас: 249 €", 24, GREEN, weight=700, anchor="end")
    s.rect(0, 2010, 1440, 490, WHITE)
    s.text(120, 2100, "КАК ПРИСОЕДИНИТЬСЯ", 12, GREEN, weight=700, letter=1.5)
    s.text(120, 2159, "Регистрация → оплата → ваш стол", 38, GREEN, "Marmelad, Georgia, serif")
    s.text(120, 2220, ["Заполните данные и выберите способ оплаты. Стол резервируется на 30 минут.", "После оплаты участие подтверждается. При предоплате остаток — по отдельной ссылке."], 17, MUTED, leading=1.7)
    s.button(120, 2350, 370, "Зарегистрироваться и занять стол", 58)
    s.text(120, 2432, "К оплате сейчас — 249 € · предоплата 50 € доступна по галочке выше", 14, MUTED)
    s.text(520, 2385, "Вопросы? Напишите Кристине в Telegram ↗", 16, GREEN, weight=700)
    s.save("TI-games-host-landing-desktop.svg")


def host_mobile(selected="standard", add_media=False, pay_deposit=False, filename="TI-games-host-landing-mobile.svg"):
    s = Svg(390, 2300)
    s.rect(0, 0, 390, 645, BG)
    header(s, 390, 16, True)
    s.text(20, 112, "МЕРОПРИЯТИЯ / ДЛЯ ВЕДУЩИХ", 11, GREEN, weight=700, letter=1.2)
    s.pill(20, 138, 190, "7 НОЯБРЯ · МЮНХЕН", GOLD, GREEN, 32, 11)
    s.text(20, 220, ["Проведите", "свою игру", "на встрече", "R.O.S.T."], 36, GREEN, "Marmelad, Georgia, serif", leading=1.08)
    s.text(20, 388, ["Две игровые линейки, новые", "знакомства и поддержка команды."], 15, MUTED, leading=1.5)
    s.button(20, 476, 350, "Зарегистрироваться и занять стол", 56, size=15)
    s.text(20, 563, ["7 столов для ведущих · бронь на 30 минут", "После оплаты стол закрепится за вами."], 12, MUTED, leading=1.5)
    s.rect(0, 645, 390, 380, WHITE)
    s.text(20, 704, "ФОРМАТ", 11, GREEN, weight=700, letter=1.3)
    s.text(20, 756, ["Ваша игра —", "в центре дня"], 32, GREEN, "Marmelad, Georgia, serif", leading=1.15)
    for i, (title, body) in enumerate([
        ("Две игровые линейки", "Две сессии по два часа"),
        ("Знакомство с участниками", "Представление на сцене"),
        ("Поддержка команды", "Пространство и продвижение"),
    ]):
        y = 837 + i * 58
        s.text(20, y, title, 14, GREEN, weight=700)
        s.text(20, y + 22, body, 12, MUTED)
    s.rect(0, 1025, 390, 855, BG)
    s.text(20, 1084, "УСЛОВИЯ", 11, GREEN, weight=700, letter=1.3)
    s.text(20, 1138, "Форматы участия", 32, GREEN, "Marmelad, Georgia, serif")
    for i, (x, y, title, price, body, condition) in enumerate([
        (20, 1180, "Стандартное", "249 €", "Проведение, профиль, анонсы, сертификат", "Ваш анонс в соцсетях раз в неделю"),
        (20, 1366, "Расширенное", "349 €", "Всё выше + продвижение команды", "Больше времени на подготовку игры"),
    ]):
        is_selected = (i == 0 and selected == "standard") or (i == 1 and selected == "expanded")
        s.rect(x, y, 350, 166, BG if is_selected else WHITE, 18, GREEN if is_selected else LINE, 2 if is_selected else 1)
        s.circle(x + 30, y + 30, 8, WHITE, GREEN if is_selected else LINE, 2)
        if is_selected:
            s.circle(x + 30, y + 30, 4, GREEN)
        s.text(x + 49, y + 38, title, 20, GREEN, weight=700)
        s.text(x + 332, y + 38, price, 23, GREEN, "Marmelad, Georgia, serif", anchor="end")
        s.text(x + 49, y + 77, body, 12, MUTED)
        s.line(x + 18, y + 98, x + 332, y + 98)
        s.text(x + 18, y + 127, condition, 12, GREEN)
    s.rect(20, 1564, 350, 104, WHITE, 17, LINE)
    s.rect(38, 1594, 20, 20, WHITE, 4, GREEN, 2)
    if add_media:
        s.text(48, 1611, "✓", 19, GREEN, weight=700, anchor="middle")
    s.text(70, 1604, "Фото и видео", 17, GREEN, weight=700)
    s.text(350, 1604, "+79 €", 21, GREEN, "Marmelad, Georgia, serif", anchor="end")
    s.text(70, 1637, "10 фото и один рилс", 13, MUTED)
    total = (249 if selected == "standard" else 349) + (79 if add_media else 0)
    deposit = pay_deposit
    s.rect(20, 1680, 350, 74, WHITE, 17, GREEN if deposit else LINE, 2 if deposit else 1)
    s.rect(38, 1704, 20, 20, WHITE, 4, GREEN, 2)
    if deposit:
        s.text(48, 1721, "✓", 19, GREEN, weight=700, anchor="middle")
    s.text(70, 1709, "Внести предоплату 50 €", 17, GREEN, weight=700)
    s.text(70, 1735, "Остаток оплатите позже по ссылке", 12, MUTED)
    s.text(20, 1793, f"Стоимость участия: {total} €", 16, GREEN, weight=700)
    s.text(20, 1831, f"Сейчас: {50 if deposit else total} €", 20, GREEN, weight=700)
    if deposit:
        s.text(370, 1831, f"Позже: {total - 50} €", 16, MUTED, anchor="end")
    s.rect(0, 1880, 390, 420, WHITE)
    s.text(20, 1933, "КАК ПРИСОЕДИНИТЬСЯ", 11, GREEN, weight=700, letter=1.2)
    s.text(20, 1975, "Регистрация → оплата → стол", 21, GREEN, "Marmelad, Georgia, serif")
    s.text(20, 2020, ["Заполните данные и выберите оплату.", "Стол резервируется на 30 минут.", "После оплаты участие подтверждается."], 12, MUTED, leading=1.55)
    s.button(20, 2120, 350, "Зарегистрироваться и занять стол", 54, size=15)
    s.text(20, 2202, f"К оплате сейчас — {50 if deposit else total} €", 13, MUTED)
    if deposit:
        s.text(20, 2228, f"50 € входят в стоимость · позже {total - 50} €", 12, MUTED)
    s.save(filename)


if __name__ == "__main__":
    purchase_desktop()
    purchase_mobile()
    practitioner_desktop()
    practitioner_mobile()
    host_desktop()
    host_mobile()
    host_mobile("standard", False, True, "TI-games-host-landing-mobile-deposit.svg")
    host_mobile("expanded", True, True, "TI-games-host-landing-mobile-expanded-media.svg")

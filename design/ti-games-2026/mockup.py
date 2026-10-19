"""Editable SVG concepts for the R.O.S.T. Munich games detail page."""

from pathlib import Path
from html import escape
from base64 import b64encode
import re

HERE = Path(__file__).resolve().parent
SITE_CSS = (HERE.parent.parent / "src" / "styles" / "global.css").read_text(encoding="utf-8")


def site_token(name):
    match = re.search(r"--" + re.escape(name) + r":\s*([^;]+);", SITE_CSS)
    if not match:
        raise ValueError(f"Site token missing: {name}")
    return match.group(1).strip()


GREEN = site_token("color-brand")
ACCENT = site_token("color-accent")
GOLD = site_token("color-brand-gold")
BG = site_token("color-brand-surface")
PALE = site_token("color-hero-end")
MUTED = site_token("color-hero-copy")
LINE = site_token("color-line")
WHITE = "#FFFFFF"

# The responsive page gutters are shared with the site. Desktop's 120 px
# inset is (1440 px artboard - 1200 px content container) / 2.
PAGE_GUTTER = {
    "desktop": (1440 - int(site_token("container-content").removesuffix("px"))) // 2,
    "tablet": int(site_token("spacing-page-tablet").removesuffix("px")),
    "mobile": int(site_token("spacing-page-mobile").removesuffix("px")),
}


class Svg:
    def __init__(self, width, height):
        self.w, self.h = width, height
        self.items = []

    def rect(self, x, y, w, h, fill, r=0, stroke=None, sw=1, opacity=1):
        border = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
        self.items.append(
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" '
            f'fill="{fill}" opacity="{opacity}"{border}/>'
        )

    def circle(self, x, y, radius, fill, stroke=None, sw=1):
        border = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
        self.items.append(f'<circle cx="{x}" cy="{y}" r="{radius}" fill="{fill}"{border}/>')

    def image_circle(self, x, y, radius, filename):
        path = HERE / "assets" / filename
        data = b64encode(path.read_bytes()).decode("ascii")
        clip = f"avatar-{len(self.items)}"
        self.items.append(f'<defs><clipPath id="{clip}"><circle cx="{x}" cy="{y}" r="{radius}"/></clipPath></defs>')
        self.items.append(f'<image x="{x-radius}" y="{y-radius}" width="{radius*2}" height="{radius*2}" '
                          f'href="data:image/png;base64,{data}" preserveAspectRatio="xMidYMid slice" clip-path="url(#{clip})"/>')

    def logo(self, x, y, size):
        path = HERE.parent.parent / "public" / "brand-tree-96.png"
        data = b64encode(path.read_bytes()).decode("ascii")
        self.items.append(f'<image x="{x}" y="{y}" width="{size}" height="{size}" '
                          f'href="data:image/png;base64,{data}"/>')

    def text(self, x, y, lines, size=18, color=GREEN, font="Onest, Arial, sans-serif", weight=400, leading=1.35, anchor="start", letter=0):
        if isinstance(lines, str):
            lines = [lines]
        base = (f'<text x="{x}" y="{y}" fill="{color}" font-family="{font}" '
                f'font-size="{size}" font-weight="{weight}" text-anchor="{anchor}" '
                f'letter-spacing="{letter}">')
        for idx, line in enumerate(lines):
            base += f'<tspan x="{x}" dy="{0 if idx == 0 else round(size * leading, 1)}">{escape(line)}</tspan>'
        self.items.append(base + "</text>")

    def line(self, x1, y1, x2, y2, color=LINE, sw=1):
        self.items.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{sw}"/>')

    def pill(self, x, y, w, label, fill=WHITE, color=GREEN, h=34, size=12):
        self.rect(x, y, w, h, fill, h // 2)
        self.text(x + w / 2, y + h / 2 + size * .35, label, size, color, weight=700, anchor="middle", letter=.5)

    def button(self, x, y, w, label, h=54, fill=GREEN, color=WHITE, size=16):
        self.rect(x, y, w, h, fill, 16)
        self.text(x + w / 2, y + h / 2 + size * .35, label, size, color, weight=700, anchor="middle")

    def save(self, name):
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" '
               f'viewBox="0 0 {self.w} {self.h}"><title>{escape(name)}</title>'
               + "".join(self.items) + "</svg>")
        (HERE / name).write_text(svg, encoding="utf-8")
        remote = svg
        photos = {
            "Speaker5-thumb.png": "Speaker5.png",
            "Speaker5.png": "Speaker5.png",
            "Katharina-thumb.png": "Katharina.png",
            "Katharina.png": "Katharina.png",
            "LenaGelmel-thumb.png": "LenaGelmel.png",
            "LenaGelmel.png": "LenaGelmel.png",
            "Zinaida1-thumb.png": "Zinaida1.png",
            "Zinaida1.png": "Zinaida1.png",
            "Alla_Afanasenko-thumb.png": "Alla_Afanasenko.png",
            "Alla_Afanasenko.png": "Alla_Afanasenko.png",
        }
        for thumb, original in photos.items():
            encoded = b64encode((HERE / "assets" / thumb).read_bytes()).decode("ascii")
            remote = remote.replace("data:image/png;base64," + encoded,
                                    "https://rost.network/assets/img/" + original)
        encoded_logo = b64encode((HERE.parent.parent / "public" / "brand-tree-96.png").read_bytes()).decode("ascii")
        remote = remote.replace("data:image/png;base64," + encoded_logo,
                                "https://rost.community/brand-tree-96.png")
        (HERE / name.replace(".svg", ".penpot.svg")).write_text(remote, encoding="utf-8")


PROGRAM = [
    ("09:30–10:00", "Регистрация"),
    ("10:00–10:10", "Открытие дня"),
    ("10:10–11:30", "Нетворкинг"),
    ("11:30–11:45", "Знакомство с ведущими"),
    ("11:45–14:00", "Первая линейка игр"),
    ("14:00–15:15", "Обед"),
    ("15:15–15:30", "Знакомство с ведущими"),
    ("15:30–17:45", "Вторая линейка игр"),
    ("17:45–18:15", "Награждение и розыгрыш"),
    ("18:30–22:00", "Ужин VIP · тариф «Пик трансформации»"),
]

PRACTITIONERS = [
    ("Кристина Бауэр", "AinSof", "Speaker5-thumb.png"),
    ("Катарина Базаль", "Вопрос в эфире", "Katharina-thumb.png"),
    ("Елена Гельмель", "Путь Желаний", "LenaGelmel-thumb.png"),
    ("Зинаида Ланглитц", "Путь к себе", "Zinaida1-thumb.png"),
    ("Алла Афанасенко", "Секс, Деньги и Любовь · Дивергент", "Alla_Afanasenko-thumb.png"),
]


def header(s, width, margin, compact=False):
    s.rect(margin, 14, width - margin * 2, 64 if not compact else 56, GREEN, 24)
    s.circle(margin + 32, 46 if not compact else 42, 22 if not compact else 18, WHITE)
    s.logo(margin + (10 if not compact else 14), 24 if not compact else 24, 44 if not compact else 36)
    s.text(margin + (66 if not compact else 59), 51 if not compact else 47, "R.O.S.T.", 16 if not compact else 14, WHITE, weight=700)
    if compact:
        s.text(width - margin - 30, 48, "☰", 22, WHITE, anchor="middle")
    else:
        s.text(width / 2 - 55, 51, "Мероприятия     О нас     Контакты", 14, WHITE, weight=700)
        s.pill(width - margin - 196, 22, 178, "Принять участие", WHITE, GREEN, 48, 14)


def ticket_card(s, x, y, w, compact=False):
    h = 566
    s.rect(x, y, w, h, WHITE, 30, LINE)
    s.rect(x, y, w, 124 if not compact else 112, PALE, 30)
    s.rect(x, y + 89 if not compact else y + 78, w, 36, PALE)
    s.text(x + 26, y + 32, "КОГДА", 12, GREEN, weight=700, letter=1.8)
    s.text(x + 26, y + 83, "7 ноября 2026", 31 if not compact else 28, GREEN, font="Marmelad, Georgia, serif")
    s.text(x + 26, y + 152, "Мюнхен · Perchtinger Straße 12", 14, MUTED)
    s.text(x + 26, y + 191, "Выберите билет участника", 16, GREEN, weight=700)
    for i, (title, detail, price, selected) in enumerate([
        ("Базовый импульс", "Игры · общие зоны · напитки · фото", "80 €", False),
        ("Пик трансформации", "Всё выше + Zoom, фото, ужин", "180 €", True),
    ]):
        option_y = y + 215 + i * 86
        s.rect(x + 20, option_y, w - 40, 78, BG if selected else WHITE, 17,
               GREEN if selected else LINE, 2 if selected else 1)
        s.circle(x + 42, option_y + 31, 8, WHITE, GREEN if selected else LINE, 2)
        if selected:
            s.circle(x + 42, option_y + 31, 4, GREEN)
        s.text(x + 59, option_y + 36, title, 15, GREEN, weight=700)
        s.text(x + w - 30, option_y + 36, price, 22, GREEN,
               font="Marmelad, Georgia, serif", anchor="end")
        s.text(x + 59, option_y + 61, detail, 11, MUTED)
    s.button(x + 20, y + 390, w - 40, "Купить билет участника", 55)
    s.rect(x + 20, y + 455, w - 40, 48, WHITE, 15, LINE)
    s.text(x + 36, y + 485, "Хочу провести игру", 14, GREEN, weight=700)
    s.text(x + w - 35, y + 485, "↗", 20, GREEN, anchor="end")
    s.text(x + w / 2, y + 539, "Состав билетов — ниже на странице", 12, MUTED, anchor="middle")


def desktop():
    s = Svg(1440, 3390)
    s.rect(0, 0, 1440, 740, BG)
    s.rect(1030, 0, 410, 740, PALE, 0, opacity=.28)
    header(s, 1440, PAGE_GUTTER["desktop"])
    s.text(120, 130, "МЕРОПРИЯТИЯ  /  ТРАНСФОРМАЦИОННЫЕ ИГРЫ", 12, GREEN, weight=700, letter=1.5)
    s.pill(120, 165, 230, "7 НОЯБРЯ · МЮНХЕН", GOLD, GREEN)
    s.text(120, 268, ["День", "трансформационных", "игр в Мюнхене"], 61, GREEN, "Marmelad, Georgia, serif", leading=1.05)
    s.line(120, 502, 497, 502, GOLD, 5)
    s.text(120, 553, ["Две игровые сессии, нетворкинг и время,", "чтобы познакомиться с людьми ближе."], 20, MUTED, leading=1.55)
    ticket_card(s, 962, 116, 358)
    s.rect(0, 740, 1440, 690, WHITE)
    s.text(120, 836, "О МЕРОПРИЯТИИ", 12, GREEN, weight=700, letter=1.8)
    s.text(120, 904, ["Провести день с пользой", "и в хорошей компании"], 45, GREEN, "Marmelad, Georgia, serif", leading=1.12)
    s.text(120, 1045, ["Вы выбираете игру, знакомитесь с ведущими и участниками,", "а затем пробуете новые взгляды на свой запрос в небольших группах."], 18, MUTED, leading=1.55)
    for i, (title, body) in enumerate([
        ("01  Знакомства", "Модерируемый нетворкинг"),
        ("02  Игры", "Две игровые линейки"),
        ("03  Общение", "Перерывы, обед и новые связи"),
    ]):
        x = 120 + i * 270
        s.rect(x, 1160, 246, 142, BG, 22)
        s.text(x + 20, 1210, title, 19, GREEN, font="Marmelad, Georgia, serif")
        s.text(x + 20, 1250, body, 13, MUTED)
    s.rect(0, 1430, 1440, 635, BG)
    s.text(120, 1527, "ПРОГРАММА", 12, GREEN, weight=700, letter=1.8)
    s.text(120, 1592, "Как пройдёт день", 45, GREEN, "Marmelad, Georgia, serif")
    for i, (time, event) in enumerate(PROGRAM):
        col = i // 5
        row = i % 5
        x = 120 + col * 410
        y = 1650 + row * 72
        s.line(x, y + 42, x + 370, y + 42)
        s.text(x, y, time, 14, GREEN, weight=700)
        s.text(x + 122, y, event, 14, MUTED)
    s.rect(0, 2065, 1440, 520, WHITE)
    s.text(120, 2157, "ИГРОПРАКТИКИ", 12, GREEN, weight=700, letter=1.8)
    s.text(120, 2223, "С кем можно сыграть", 45, GREEN, "Marmelad, Georgia, serif")
    for i, (name, game, photo) in enumerate(PRACTITIONERS):
        x = 120 + i * 242
        s.circle(x + 90, 2338, 71, BG, WHITE, 5)
        s.image_circle(x + 90, 2338, 66, photo)
        s.text(x + 90, 2450, name, 16, GREEN, weight=700, anchor="middle")
        s.text(x + 90, 2480, game, 12, MUTED, anchor="middle")
    s.rect(0, 2585, 1440, 605, BG)
    s.text(120, 2673, "БИЛЕТЫ", 12, GREEN, weight=700, letter=1.8)
    s.text(120, 2740, "Что входит в участие", 45, GREEN, "Marmelad, Georgia, serif")
    s.rect(120, 2790, 570, 286, WHITE, 24, LINE)
    s.rect(710, 2790, 610, 286, WHITE, 24, LINE)
    s.text(150, 2843, "Базовый импульс  ·  80 €", 27, GREEN, "Marmelad, Georgia, serif")
    s.text(740, 2843, "Пик трансформации  ·  180 €", 27, GREEN, "Marmelad, Georgia, serif")
    s.text(150, 2895, ["Участие в играх", "Доступ к общим зонам", "Вода, чай, кофе", "Общая фотография участников"], 16, MUTED, leading=2.0)
    s.text(740, 2895, ["Всё из «Базового импульса»", "Групповой Zoom и профессиональные фото", "Закрытый чат, ужин с ведущими", "Приоритет места и консультация 15–20 минут"], 16, MUTED, leading=2.0)
    s.rect(0, 3190, 1440, 200, GREEN)
    s.text(120, 3270, "Есть вопросы перед встречей?", 33, WHITE, "Marmelad, Georgia, serif")
    s.text(120, 3312, "Напишите нам — поможем выбрать формат участия.", 16, WHITE)
    s.button(1010, 3250, 310, "Связаться с нами  →", 54, WHITE, GREEN)
    s.save("TI-games-desktop-1440.svg")


def mobile():
    s = Svg(390, 3684)
    s.rect(0, 0, 390, 1046, BG)
    header(s, 390, 16, True)
    s.text(20, 113, "МЕРОПРИЯТИЯ  /  ИГРЫ", 11, GREEN, weight=700, letter=1.4)
    s.pill(20, 139, 188, "7 НОЯБРЯ · МЮНХЕН", GOLD, GREEN, 32, 11)
    s.text(20, 220, ["День", "трансформационных", "игр в Мюнхене"], 35, GREEN, "Marmelad, Georgia, serif", leading=1.13)
    s.line(20, 321, 290, 321, GOLD, 4)
    s.text(20, 363, ["Две игровые сессии, нетворкинг", "и время для новых знакомств."], 16, MUTED, leading=1.5)
    ticket_card(s, 20, 432, 350, compact=True)
    s.rect(0, 1046, 390, 475, WHITE)
    s.text(20, 1106, "О МЕРОПРИЯТИИ", 11, GREEN, weight=700, letter=1.6)
    s.text(20, 1158, ["День с пользой", "и в хорошей", "компании"], 33, GREEN, "Marmelad, Georgia, serif", leading=1.1)
    s.text(20, 1306, ["Выбирайте игру, знакомьтесь с", "ведущими и участниками. Игры", "проходят в небольших группах."], 16, MUTED, leading=1.55)
    for i, (title, body) in enumerate([("Знакомства", "Модерируемый нетворкинг"), ("Игры", "Две игровые линейки")]):
        y = 1390 + i * 65
        s.circle(34, y - 6, 8, GOLD)
        s.text(54, y, title, 17, GREEN, weight=700)
        s.text(54, y + 22, body, 13, MUTED)
    s.rect(0, 1521, 390, 925, BG)
    s.text(20, 1576, "ПРОГРАММА", 11, GREEN, weight=700, letter=1.6)
    s.text(20, 1628, "Как пройдёт день", 32, GREEN, "Marmelad, Georgia, serif")
    for i, (time, event) in enumerate(PROGRAM):
        y = 1681 + i * 75
        s.line(20, y + 50, 370, y + 50)
        s.text(20, y, time, 14, GREEN, weight=700)
        s.text(20, y + 23, event, 14, MUTED)
    s.rect(0, 2446, 390, 444, WHITE)
    s.text(20, 2501, "ИГРОПРАКТИКИ", 11, GREEN, weight=700, letter=1.6)
    s.text(20, 2551, "С кем можно сыграть", 31, GREEN, "Marmelad, Georgia, serif")
    for i, (name, game, photo) in enumerate(PRACTITIONERS):
        y = 2601 + i * 58
        s.circle(42, y, 20, BG, LINE)
        s.image_circle(42, y, 19, photo)
        s.text(74, y, name, 17, GREEN, weight=700)
        s.text(74, y + 20, game, 13, MUTED)
    s.rect(0, 2890, 390, 594, BG)
    s.text(20, 2945, "БИЛЕТЫ", 11, GREEN, weight=700, letter=1.6)
    s.text(20, 2995, "Что входит", 32, GREEN, "Marmelad, Georgia, serif")
    s.rect(20, 3025, 350, 190, WHITE, 22, LINE)
    s.text(38, 3071, "Базовый импульс · 80 €", 23, GREEN, "Marmelad, Georgia, serif")
    s.text(38, 3111, ["Игры и общие зоны", "Вода, чай, кофе", "Общая фотография участников"], 15, MUTED, leading=2)
    s.rect(20, 3239, 350, 215, WHITE, 22, LINE)
    s.text(38, 3285, "Пик трансформации · 180 €", 22, GREEN, "Marmelad, Georgia, serif")
    s.text(38, 3324, ["Всё из базового тарифа", "Zoom, фото, закрытый чат", "Ужин, приоритет места", "Консультация 15–20 минут"], 15, MUTED, leading=2)
    s.rect(0, 3484, 390, 200, GREEN)
    s.text(20, 3544, "Остались вопросы?", 28, WHITE, "Marmelad, Georgia, serif")
    s.text(20, 3576, "Напишите нам — подскажем.", 15, WHITE)
    s.button(20, 3604, 350, "Связаться с нами  →", 48, WHITE, GREEN, 14)
    s.save("TI-games-mobile-390.svg")

    # The sticky bar offers one entry point to both tariffs. It does not imply
    # that the basic tariff was selected before the visitor opens the chooser.
    state = Svg(390, 844)
    state.rect(0, 0, 390, 844, BG)
    header(state, 390, 16, True)
    state.text(20, 128, "ПРОГРАММА", 11, GREEN, weight=700, letter=1.6)
    state.text(20, 185, "Как пройдёт день", 32, GREEN, "Marmelad, Georgia, serif")
    for i, (time, event) in enumerate(PROGRAM[:6]):
        y = 252 + i * 82
        state.line(20, y + 47, 370, y + 47)
        state.text(20, y, time, 14, GREEN, weight=700)
        state.text(20, y + 23, event, 14, MUTED)
    state.rect(0, 750, 390, 94, WHITE, 0, LINE)
    state.button(20, 769, 350, "Купить билет участника", 56, GREEN, WHITE, 16)
    state.save("TI-games-mobile-sticky-390.svg")

    # The same scrolled page with the tariff chooser opened as a bottom sheet.
    choose = Svg(390, 844)
    choose.items = state.items.copy()
    choose.rect(0, 0, 390, 844, GREEN, opacity=.62)
    choose.rect(0, 260, 390, 584, WHITE, 28)
    choose.rect(0, 287, 390, 557, WHITE)
    choose.text(24, 309, "БИЛЕТЫ · 7 НОЯБРЯ", 11, GREEN, weight=700, letter=1.4)
    choose.text(24, 355, "Выберите билет", 32, GREEN, "Marmelad, Georgia, serif")
    choose.circle(350, 309, 18, WHITE, GREEN)
    choose.text(350, 315, "×", 21, GREEN, anchor="middle")
    choose.rect(20, 388, 350, 112, WHITE, 18, LINE)
    choose.circle(44, 419, 8, WHITE, LINE, 2)
    choose.text(62, 424, "Базовый импульс", 17, GREEN, weight=700)
    choose.text(350, 424, "80 €", 23, GREEN, "Marmelad, Georgia, serif", anchor="end")
    choose.text(62, 453, "Игры, общие зоны, напитки и фото", 13, MUTED)
    choose.rect(20, 516, 350, 132, BG, 18, GREEN, 2)
    choose.circle(44, 548, 8, WHITE, GREEN, 2)
    choose.circle(44, 548, 4, GREEN)
    choose.text(62, 553, "Пик трансформации", 17, GREEN, weight=700)
    choose.text(350, 553, "180 €", 23, GREEN, "Marmelad, Georgia, serif", anchor="end")
    choose.text(62, 583, ["Всё из базового тарифа, Zoom и фото,", "ужин, приоритет места и консультация"], 13, MUTED, leading=1.5)
    choose.text(24, 689, "Состав тарифов указан на странице мероприятия.", 12, MUTED)
    choose.button(20, 746, 350, "Продолжить", 58, GREEN, WHITE, 16)
    choose.save("TI-games-mobile-choose-390.svg")


def tablet():
    s = Svg(768, 3025)
    s.rect(0, 0, 768, 1070, BG)
    header(s, 768, PAGE_GUTTER["tablet"], True)
    s.text(32, 123, "МЕРОПРИЯТИЯ  /  ТРАНСФОРМАЦИОННЫЕ ИГРЫ", 12, GREEN, weight=700, letter=1.3)
    s.pill(32, 152, 216, "7 НОЯБРЯ · МЮНХЕН", GOLD, GREEN)
    s.text(32, 242, ["День трансформационных", "игр в Мюнхене"], 49, GREEN, "Marmelad, Georgia, serif", leading=1.08)
    s.line(32, 330, 425, 330, GOLD, 5)
    s.text(32, 376, ["Две игровые сессии, нетворкинг и время", "для новых знакомств."], 19, MUTED, leading=1.5)
    ticket_card(s, 194, 452, 380, compact=True)
    s.rect(0, 1070, 768, 345, WHITE)
    s.text(32, 1123, "О МЕРОПРИЯТИИ", 12, GREEN, weight=700, letter=1.5)
    s.text(32, 1185, ["Провести день с пользой", "и в хорошей компании"], 39, GREEN, "Marmelad, Georgia, serif", leading=1.1)
    s.text(32, 1300, ["Вы выбираете игру, знакомитесь с ведущими и участниками,", "а затем пробуете новые взгляды на свой запрос в группах."], 17, MUTED, leading=1.5)
    s.rect(0, 1415, 768, 675, BG)
    s.text(32, 1480, "ПРОГРАММА", 12, GREEN, weight=700, letter=1.5)
    s.text(32, 1535, "Как пройдёт день", 39, GREEN, "Marmelad, Georgia, serif")
    for i, (time, event) in enumerate(PROGRAM):
        col, row = i // 5, i % 5
        x, y = 32 + col * 370, 1593 + row * 88
        s.line(x, y + 52, x + 330, y + 52)
        s.text(x, y, time, 13, GREEN, weight=700)
        s.text(x, y + 25, event, 13, MUTED)
    s.rect(0, 2090, 768, 390, WHITE)
    s.text(32, 2150, "ИГРОПРАКТИКИ", 12, GREEN, weight=700, letter=1.5)
    s.text(32, 2205, "С кем можно сыграть", 39, GREEN, "Marmelad, Georgia, serif")
    for i, (name, game, photo) in enumerate(PRACTITIONERS):
        col, row = i % 2, i // 2
        x, y = 32 + col * 360, 2255 + row * 64
        s.circle(x + 23, y, 21, BG, LINE)
        s.image_circle(x + 23, y, 20, photo)
        s.text(x + 58, y, name, 15, GREEN, weight=700)
        s.text(x + 58, y + 20, game, 12, MUTED)
    s.rect(0, 2480, 768, 355, BG)
    s.text(32, 2539, "БИЛЕТЫ", 12, GREEN, weight=700, letter=1.5)
    s.text(32, 2597, "Что входит в участие", 39, GREEN, "Marmelad, Georgia, serif")
    s.rect(32, 2630, 335, 143, WHITE, 20, LINE)
    s.rect(383, 2630, 353, 143, WHITE, 20, LINE)
    s.text(50, 2675, "Базовый импульс · 80 €", 22, GREEN, "Marmelad, Georgia, serif")
    s.text(50, 2710, ["Игры, общие зоны, напитки,", "общая фотография участников"], 13, MUTED, leading=1.5)
    s.text(401, 2675, "Пик трансформации · 180 €", 21, GREEN, "Marmelad, Georgia, serif")
    s.text(401, 2710, ["Всё выше + Zoom, фото, чат, ужин,", "приоритет места и консультация"], 13, MUTED, leading=1.5)
    s.rect(0, 2835, 768, 190, GREEN)
    s.text(32, 2914, "Есть вопросы перед встречей?", 31, WHITE, "Marmelad, Georgia, serif")
    s.text(32, 2950, "Напишите нам — поможем выбрать формат.", 15, WHITE)
    s.button(476, 2900, 260, "Связаться с нами  →", 52, WHITE, GREEN, 14)
    s.save("TI-games-tablet-768.svg")


def desktop_scrolled():
    s = Svg(1440, 1250)
    s.rect(0, 0, 1440, 840, BG)
    header(s, 1440, PAGE_GUTTER["desktop"])
    s.text(120, 152, "ПРОГРАММА", 12, GREEN, weight=700, letter=1.8)
    s.text(120, 217, "Как пройдёт день", 45, GREEN, "Marmelad, Georgia, serif")
    for i, (time, event) in enumerate(PROGRAM[:6]):
        y = 290 + i * 80
        s.line(120, y + 43, 800, y + 43)
        s.text(120, y, time, 15, GREEN, weight=700)
        s.text(280, y, event, 15, MUTED)
    ticket_card(s, 962, 116, 358)
    s.rect(0, 840, 1440, 410, WHITE)
    s.text(120, 927, "ИГРОПРАКТИКИ", 12, GREEN, weight=700, letter=1.8)
    s.text(120, 994, "С кем можно сыграть", 45, GREEN, "Marmelad, Georgia, serif")
    for i, (name, game, photo) in enumerate(PRACTITIONERS):
        x = 120 + i * 242
        s.circle(x + 90, 1092, 66, BG, WHITE, 5)
        s.image_circle(x + 90, 1092, 62, photo)
        s.text(x + 90, 1190, name, 16, GREEN, weight=700, anchor="middle")
        s.text(x + 90, 1218, game, 12, MUTED, anchor="middle")
    s.save("TI-games-desktop-scrolled-1440.svg")


if __name__ == "__main__":
    desktop()
    desktop_scrolled()
    tablet()
    mobile()

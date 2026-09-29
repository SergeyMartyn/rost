# Черновик meta description (на утверждение)

Статус: **черновик, в код не внесён.** Нужно ваше согласование текста.

Почему: сейчас у всех страниц, кроме главной, описание шаблонное —
`"{Название страницы} — R.O.S.T."` (`src/pages/[...path].astro`, строка с
`description={page === 'home' ? t.description : ...}`). Для поиска и AI-выдачи
это слабо. Ниже — уникальные описания на RU и DE (ориентир 120–155 символов).
Домашняя страница уже с хорошим описанием — предлагаю оставить как есть.

| Страница | Язык | Предлагаемое описание |
| --- | --- | --- |
| Главная (оставить) | RU | R.O.S.T. — русскоязычное сообщество в Германии. Находите людей, с которыми захочется встретиться снова. |
| Главная (оставить) | DE | R.O.S.T. verbindet russischsprachige Menschen in Deutschland. Finde Menschen, die du gern wiedersehen möchtest. |
| Мероприятия | RU | Встречи и трансформационные игры R.O.S.T.: Регенсбург 10 октября, Мюнхен 7 ноября 2026. Даты, адреса и цены. |
| Veranstaltungen | DE | Treffen und Transformationsspiele von R.O.S.T.: Regensburg am 10. Oktober, München am 7. November 2026. Termine und Preise. |
| О нас | RU | R.O.S.T. — сообщество людей в Германии, которым важно живое общение и новые знакомства. Узнайте, чем мы занимаемся и кто в команде. |
| Über uns | DE | R.O.S.T. ist eine Gemeinschaft in Deutschland, der persönliche Begegnungen und neue Bekanntschaften wichtig sind. Lerne uns und das Team kennen. |
| Контакты | RU | Как связаться с R.O.S.T.: напишите нам по электронной почте. Ответим на вопросы о встречах и участии. |
| Kontakt | DE | So erreichst du R.O.S.T.: Schreib uns per E-Mail. Wir beantworten Fragen zu Treffen und Teilnahme. |
| Условия участия | RU | Условия участия во встречах R.O.S.T.: стоимость, оформление участия и порядок оплаты для мероприятий в Германии. |
| Teilnahmebedingungen | DE | Teilnahmebedingungen für die Treffen von R.O.S.T.: Preise, Anmeldung und Zahlungsablauf für die Veranstaltungen. |
| Правовая информация | RU | Правовая информация R.O.S.T.: ответственное лицо, адрес и контакт для связи. |
| Impressum | DE | Impressum von R.O.S.T.: verantwortliche Person, Anschrift und Kontakt. |
| Конфиденциальность | RU | Политика конфиденциальности R.O.S.T.: какие данные мы обрабатываем, зачем и как управлять согласием на cookie. |
| Datenschutz | DE | Datenschutzerklärung von R.O.S.T.: welche Daten wir verarbeiten, wozu und wie du deine Cookie-Einwilligung verwaltest. |

## Если утвердите

Технически нужно добавить поле `description` для каждой страницы в словарь
`text` (`src/lib/site.ts`) и использовать его в `src/pages/[...path].astro`
вместо текущего шаблона. Эти файлы я специально не менял, пока не согласован
текст (и чтобы не пересечься с работой над оплатой).

## Замечания

- Даты и цены в описании «Мероприятия»/«Условия участия» — факты из текущего
  контента; если оплата их изменит, тексты нужно обновить.
- Юридические тексты в description не выдумываются; формулировки правовых
  страниц стоит согласовать с владельцем.

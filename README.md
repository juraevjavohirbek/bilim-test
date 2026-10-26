# BilimTest

React ta'lim platformasi: fanlar, mavzular, testlar, o'qituvchi boshqaruvi va to'rtta o'yin rejimi.

## Kompyuterda ishga tushirish

Node.js 22.12 yoki undan yangi versiyasi kerak.

```sh
npm install
npm run dev
```

Terminaldagi Vite manzilini oching. `npm run dev` React va 3001-portdagi API'ni birga ishga tushiradi.

O'qituvchi emaili, paroli va ismi `server/teachers.js` ichidagi `defaultTeachers` ro'yxatida. Bu ro'yxat GitHub'ga ham yuklanadi va Netlify'da alohida sozlamasiz ishlaydi. O'zgartirgach mahalliy serverni qayta yoqing; internetdagi sayt uchun commit va push qiling.

Mahalliy savollar `data/tests.json` ichida; qo'shish, tahrirlash va o'chirish aynan shu faylni yangilaydi.

## GitHub orqali Netlify'ga joylash

1. Loyihani GitHub repository'ga yuklang. `node_modules`, `dist`, `.netlify`, `.env` va `server/teachers.local.json` yuklanmaydi. `.gitignore` shunga sozlangan. Agar maxfiy fayl avval Git'ga qo'shilgan bo'lsa, uni repository va tarixdan alohida olib tashlash kerak; `.gitignore` avvalgi commitlarni o'zgartirmaydi.
2. Netlify'da yangi project ochib, GitHub repository'ni ulang. Loyihaning `package.json` va `netlify.toml` joylashgan papkasini base directory sifatida ishlating.
3. Kirish ma'lumotlari `server/teachers.js` da mavjud; Environment variables kiritish shart emas. Agar ularni koddan alohida sozlamoqchi bo'lsangiz, **Project configuration > Environment variables** ichiga quyidagilarni kiriting. Ular koddagi ro'yxatdan ustun turadi va Functions uchun ham mavjud bo'lishi kerak:

| Nomi | Qiymati |
| --- | --- |
| `TEACHER_EMAIL` | Kirish uchun o'z emailingiz |
| `TEACHER_PASSWORD` | Kirish uchun o'z parolingiz |
| `TEACHER_NAME` | Saytda ko'rinadigan ismingiz (ixtiyoriy) |

Environment variables ishlatsangiz, nomlarga `VITE_` qo'shmang. Koddagi joriy login ma'lumotlari ochiq repository'da hammaga ko'rinadi; ularni ko'rgan odam o'qituvchi bo'lib kirishi va savollarni o'zgartirishi mumkin.

4. Deploy qiling. Sozlamalar `netlify.toml` dan olinadi:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
   - Node.js: `22`
5. Saytda fanlarni oching, o'qituvchi sifatida kiring. Bitta vaqtinchalik mavzu va savol qo'shing, nomini tahrirlang, sahifani yangilang va keyin o'chirib tekshiring. O'yinlar va oddiy testda javobni tekshirish ham shu API orqali ishlaydi.

Faqat `dist` papkasini drag-and-drop qilib yuklash yetmaydi: API function ham deploy bo'lishi kerak. GitHub orqali deploy barcha kerakli qismlarni yig'adi.

Environment variables o'zgargandan keyin qayta deploy qiling. `/api/session` JSON qaytarishi kerak; HTML qaytsa API redirect yoki function deployini tekshiring. Login 503 qaytarsa `TEACHER_EMAIL` va `TEACHER_PASSWORD` ni tekshiring. Boshqa API xatolari Netlify Functions logida ko'rinadi.

## Internetda savollar qayerga saqlanadi?

Netlify'da API **Netlify Functions**, doimiy saqlash esa **Netlify Blobs** orqali ishlaydi. Alohida ma'lumotlar bazasi hisobi yoki API tokenini kiritish talab qilinmaydi: function Netlify project omboriga avtomatik ulanadi.

- Birinchi `/api/tests` so'rovida `data/tests.json` boshlang'ich savollari `bilimtest` omboridagi `data/tests.json` kalitiga ko'chadi.
- Keyingi qo'shish, tahrirlash va o'chirishlar shu doimiy omborga yoziladi. Ular GitHub'dagi JSON faylni o'zgartirmaydi.
- Yangi deploy mavjud savollarni boshlang'ich JSON bilan bosib ketmaydi. Sayt bir xil Netlify project ichida qayta deploy qilinsa ma'lumotlar saqlanadi. Boshqa project ochilsa uning ombori alohida bo'ladi.
- Kuchli izchillik va ETag bilan shartli yozish parallel o'qituvchi o'zgarishlarining yo'qolishini oldini oladi. Xatoda mahalliy faylga yashirin yozish yoki xotirada vaqtincha saqlashga o'tilmaydi.
- Shu projectning preview va branch deploylari ham bitta site-wide omborni ko'radi. Ular uchun production o'qituvchi parolini bermang; ombor ma'lumotlarini Netlify Blobs bo'limidan boshqarish mumkin.
- O'quvchi saytni yangilaganda yoki brauzer oynasiga qaytganda yangi ma'lumot olinadi. Bu jonli chat kabi har soniya yangilanadigan tizim emas.

Rasmiy manbalar: [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/), [Netlify Functions](https://docs.netlify.com/build/functions/get-started/), [Environment variables](https://docs.netlify.com/build/environment-variables/get-started/).

## Kirish va testlar

O'qituvchi sessiyasi 8 soat amal qiladi. Netlify'da sessiya omborda saqlanadi, shuning uchun boshqa function instance'ga o'tganda ham kirish saqlanadi. Chiqish sessiyani bekor qiladi. Email yoki parolni almashtirib deploy qilish eski sessiyalarni bekor qiladi. Cookie HTTPS uchun `Secure`, shuningdek `HttpOnly` va `SameSite=Strict` bilan beriladi.

To'g'ri javoblar o'quvchining savollar ro'yxatiga yuborilmaydi. Javob berish va natija hisoblash serverda bajariladi. Faqat o'qituvchi mavzu va savollarni o'zgartira oladi. Mavzu o'chirilsa, uning savollari ham o'chadi.

## O'yin rejimlari

- **Oddiy:** savollar navbat bilan chiqadi.
- **Baraban:** baraban aylangach, tanlangan raqamdagi savol modalda ochiladi.
- **Lotto:** sharlar aralashib, tanlangan savol modalda ochiladi.
- **Arqon tortish:** jamoalar navbat bilan javob beradi. To'g'ri javob arqonni jamoa tomoniga siljitadi.

Javob berilgan raqam o'yindan chiqadi va qayta tushmaydi. Javobsiz yopilgan savolni davom ettirish mumkin. O'yin sahifalari ekran balandligiga moslashadi.

`src/assets/doppi-boy.png` — imagegen bilan yaratilgan do'ppili bola. Baraban, lotto va jamoalar shu qahramondan foydalanadi. Animatsiya va o'yin mexanikasi kodda bajariladi.

O'yin paneli va savol modali har bir fanga mos rasmli fon ishlatadi. Har fan uchun uchta SVG fon `src/assets/subject-backgrounds` ichida. Har yangi savolda fon almashadi; javobsiz yopilgan savol qayta ochilganda o'sha fon qoladi. Manba bezaklarini o'zgartirgach, fonlarni `node scripts/generate-subject-backgrounds.mjs` orqali qayta yaratish mumkin.

O'yin paneli, savol modali va oddiy testning yuqori o'ng burchagidagi kattalashtirish belgisi butun ekranga yoyadi. Shu belgi yoki `Esc` bilan avvalgi o'lchamga qaytiladi. Brauzer ruxsat berganda native fullscreen, qolgan qurilmalarda ekran o'lchamidagi ko'rinish ishlatiladi.

Variant bosilganda javob darhol serverda tekshiriladi; alohida tasdiqlash tugmasi yo'q. To'g'ri javob uchun Perfect, Bravo yoki Barakalla oynasi emoji va qarsak bilan chiqadi. Noto'g'ri javobda Afsus, keyingi safar oynasi va ikki qisqa buzzer eshitiladi. Javob variantlariga qizil-yashil belgilar qo'yilmaydi. Natija oynasidagi karnay tugmasi ovozni qayta eshittiradi. Ovozlar Web Audio orqali lokal yaratiladi. Oddiy testda davom etish keyingi savolga, o'yinda esa maydonga qaytaradi.

## Tekshirish

```sh
npm test
npm run lint
npm run build
```

Testlar mahalliy JSON API'ni va rasmiy Netlify Blobs SDK orqali test transportidagi omborni tekshiradi: CRUD, parallel yozish, yangi deploy, sessiya, chiqish, kirish cheklovi va o'yinlar. Ular haqiqiy Netlify hisobiga ma'lumot yozmaydi. Haqiqiy hosting tekshiruvini deploydan keyin yuqoridagi 5-qadam bilan bajaring.

# BilimTest

React ta'lim platformasi: fanlar, mavzular, testlar, o'qituvchi boshqaruvi va to'rtta o'yin rejimi.

## Kompyuterda ishga tushirish

Node.js 22.12 yoki undan yangi versiyasi kerak.

```sh
npm install
npm run dev
```

Terminaldagi Vite manzilini oching. `npm run dev` React va 3001-portdagi API'ni birga ishga tushiradi.

Mahalliy o'qituvchilar `server/teachers.local.json` ichida. Bu fayl GitHub'ga yuklanmaydi. Yangi kompyuterda `server/teachers.example.json` dan shu nomda nusxa olib, ism, email va parolingizni yozing. O'zgartirgach serverni qayta yoqing. Netlify'dagi o'qituvchi sozlamalari alohida, quyida ko'rsatilgan.

Mahalliy savollar `data/tests.json` ichida; qo'shish, tahrirlash va o'chirish aynan shu faylni yangilaydi.

## GitHub orqali Netlify'ga joylash

1. Loyihani GitHub repository'ga yuklang. `node_modules`, `dist`, `.netlify`, `.env` va `server/teachers.local.json` yuklanmaydi. `.gitignore` shunga sozlangan. Agar maxfiy fayl avval Git'ga qo'shilgan bo'lsa, uni repository va tarixdan alohida olib tashlash kerak; `.gitignore` avvalgi commitlarni o'zgartirmaydi.
2. Netlify'da yangi project ochib, GitHub repository'ni ulang. Loyihaning `package.json` va `netlify.toml` joylashgan papkasini base directory sifatida ishlating.
3. **Project configuration > Environment variables** ichiga quyidagilarni kiriting. Qiymatlar Functions uchun ham mavjud bo'lsin (standart all scopes ham ishlaydi):

| Nomi | Qiymati |
| --- | --- |
| `TEACHER_EMAIL` | Kirish uchun o'z emailingiz |
| `TEACHER_PASSWORD` | Kirish uchun o'z parolingiz |
| `TEACHER_NAME` | Saytda ko'rinadigan ismingiz (ixtiyoriy) |

Bu nomlarga `VITE_` qo'shmang. Parolni kodga yoki `netlify.toml` ichiga yozmang. Production qiymatlarini Production deploy context uchun bering; preview saytlarga o'qituvchi parolini berish shart emas.

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

`src/assets/bear-host.png` va `src/assets/rabbit-host.png` original, imagegen bilan yaratilgan qahramonlar. Animatsiya va o'yin mexanikasi kodda bajariladi.

## Tekshirish

```sh
npm test
npm run lint
npm run build
```

Testlar mahalliy JSON API'ni va rasmiy Netlify Blobs SDK orqali test transportidagi omborni tekshiradi: CRUD, parallel yozish, yangi deploy, sessiya, chiqish, kirish cheklovi va o'yinlar. Ular haqiqiy Netlify hisobiga ma'lumot yozmaydi. Haqiqiy hosting tekshiruvini deploydan keyin yuqoridagi 5-qadam bilan bajaring.

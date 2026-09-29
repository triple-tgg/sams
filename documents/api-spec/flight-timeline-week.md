# Flight Timeline — Week View: API Data Requirements

หน้า Flight Timeline > View : **Week** แสดง flight ทั้งสัปดาห์ (จันทร์–อาทิตย์) เป็น 7 แถว แถวละ 1 วัน
แกนนอน 00:00–24:00 (เวลา local) แต่ละ flight เป็น bar จาก STA → STD และถ้า flight คร่อมเที่ยงคืน
จะถูกแบ่งเป็นหลายช่วงไปแสดงในแต่ละวัน (มีลูกศรบอกว่าต่อจากวันก่อน / ต่อไปวันถัดไป)

## 1. Endpoint

ใช้ endpoint เดิม **`POST /flight/listdata-planby`** ได้เลย (ไม่ต้องสร้างใหม่) — FE ส่งช่วงวันที่ทั้งสัปดาห์

### Request

```json
{
  "stationCodeList": ["BKK", "DMK"],
  "dateStart": "2026-09-27 17:00:00",
  "dateEnd":   "2026-10-04 16:59:59",
  "page": 1,
  "perPage": 1000
}
```

| Field | Type | หมายเหตุ |
|---|---|---|
| `stationCodeList` | `string[]` | `[]` = ทุก station |
| `dateStart` | `string` UTC `YYYY-MM-DD HH:mm:ss` | จันทร์ 00:00 local แปลงเป็น UTC |
| `dateEnd` | `string` UTC `YYYY-MM-DD HH:mm:ss` | อาทิตย์ 23:59:59 local แปลงเป็น UTC |

### Backend requirements (สำคัญ)

1. **กรองแบบ overlap ไม่ใช่กรองแค่ STA**
   ต้องคืน flight ที่ `STA < dateEnd AND STD > dateStart`
   เพื่อให้ flight ที่ STA วันอาทิตย์ก่อนหน้า แต่ STD วันจันทร์ ยังแสดงในแถววันจันทร์
   (ถ้าไม่มี STD ให้ใช้ `STA + 1 ชม.`)
2. **ไม่ตัดหน้า (no pagination) สำหรับช่วง ≤ 7 วัน** — 1 สัปดาห์อาจมี 400–1,000+ flight
   ถ้าต้องจำกัด ให้ `perPage` สูงสุดรองรับอย่างน้อย 3,000 และคืน `total` ที่ถูกต้อง
3. **จำกัดช่วงวันที่** ไม่เกิน 7 วัน (หรือ 8 วันเผื่อ timezone) — ถ้าเกินคืน 400
4. เรียงผลตาม `arrivalStaDate ASC`
5. **1 flight = 1 item (ห้ามแตกเป็นรายวัน)**
   ตอนนี้ backend แตก flight ที่คร่อมหลายวันเป็นหลาย item ที่มี `id` ซ้ำกัน (ต่างกันแค่ `since`/`till`/`channelUuid`)
   แต่ FE วาด bar จาก `arrivalStaDate` → `departureStdDate` เต็มช่วง และแบ่งรายวันเอง
   ตอนนี้ FE แสดงทุก item ตามที่ API ส่งมา จึงเห็น bar ของ flight เดียวกันซ้ำ
6. **ข้อมูลเวลาต้องสมเหตุสมผล** — `departureStdDate` ต้องมากกว่า `arrivalStaDate`
   (เช่น `TEST123` id 2531: STA `2026-09-29T23:45Z` แต่ STD `2026-09-29T17:00Z` ซึ่งอยู่ก่อน STA)

## 2. Response item ที่ FE ต้องการ

ปัจจุบัน day view ต้องยิง 2 API (`listdata` + `listdata-planby`) แล้ว join กันเพื่อเอา AC type / staff
สำหรับ week view อยากให้ **`listdata-planby` คืนข้อมูลครบใน call เดียว** ตามนี้

```ts
type WeekFlightItem = {
  id: string;                    // "<flightInfosId>-arrival" (unique ต่อ bar)
  flightInfosId: number;

  arrivalFlightNo: string | null;
  departureFlightNo: string | null;

  // เวลาทั้งหมดเป็น UTC ISO 8601 (มี Z) — FE แปลง local เอง
  arrivalStaDate: string;        // ใช้เป็นจุดเริ่ม bar (required)
  departureStdDate: string | null; // จุดจบ bar, null = ไม่มี STD
  arrivalAtaDate?: string | null;
  departureAtdDate?: string | null;

  airlineObj: {
    code: string;                // "MH"
    name: string;                // "Malaysia Airlines"
  };
  color: {                       // สี bar ต่อ airline
    background: string;          // "#1E3A8A"
    foreground: string;          // "#FFFFFF"
  };

  stationCode: string;           // "BKK"
  acReg: string | null;
  aircraftTypeCode: string | null; // "A321"
  bayNo: string | null;

  status: string;                // status code
  csList: { name: string; displayName?: string }[];
  mechList: { name: string; displayName?: string }[];
};
```

| Field | ใช้ทำอะไรใน Week view | สถานะปัจจุบัน |
|---|---|---|
| `arrivalStaDate` / `departureStdDate` | ตำแหน่ง + ความยาว bar | มีแล้ว |
| `arrivalFlightNo` / `departureFlightNo` | label บน bar (`MH796/ MH797`) | มีแล้ว |
| `color.background/foreground` | สี bar | มีแล้ว |
| `airlineObj.name` | tooltip | มีแล้ว (optional) |
| `aircraftTypeCode` | tooltip | มีใน type แต่ต้องยืนยันว่าส่งจริง |
| `csList` / `mechList` | tooltip | มีใน type แต่ต้องยืนยันว่าส่งจริง |
| `flightInfosId` | เปิดรายละเอียด / join | **ต้องเพิ่ม** (ตอนนี้ต้อง parse จาก `id`) |
| `stationCode` | แยก station เมื่อเลือกหลาย station | **ต้องเพิ่ม** |
| `acReg`, `bayNo` | tooltip (อนาคต) | **ต้องเพิ่ม** |

### ไม่ต้องใช้ / ขอเลิกใช้

- `since` / `till` — ปัจจุบันเพี้ยน 7 ชม. (backend offset bug) FE ใช้ `arrivalStaDate` / `departureStdDate` แทนแล้ว
- `channelUuid` — week view จัด lane เองฝั่ง FE (ขึ้นกับความกว้าง pixel ของ bar) backend ไม่ต้องคำนวณ
- `arrivalStatime`, `departureStdTime`, `arrivalDate`, `departureDate` — derive จาก ISO ได้

## 3. Response envelope

ใช้ format เดิม

```json
{
  "message": "success",
  "responseData": [ /* WeekFlightItem[] */ ],
  "page": 1,
  "perPage": 1000,
  "total": 434,
  "totalAll": 434,
  "error": ""
}
```

## 4. Optional (phase 2)

- `summary.dailyCounts`: `{ "2026-09-28": 62, ... }` — ถ้าอยากให้ตัวเลข "62 flights" มาจาก backend
  (ตอนนี้ FE นับเองจาก flight ที่ overlap แต่ละวัน โดยวันเป็น local timezone ของ browser)

## 5. ผลตรวจ API จริง (staging, 29 Sep 2026)

ยิงช่วงวันเดียวกันไปทั้ง 2 endpoint (ทุก station):

| ช่วงที่ขอ (เวลาไทย) | `listdata` | `listdata-planby` |
|---|---|---|
| 28 Sep (1 วัน) | — | 3 item (2581, 2582×2) |
| 29 Sep (1 วัน) | **2** (2582, 2583) | **3** (2582, 2583×2) |
| 30 Sep (1 วัน) | — | 5 item (2583, 2584×2, 2555×2) |
| 28 Sep – 04 Oct | **9** (1 id = 1 item) | **14** (มี id ซ้ำ 5 ตัว) |

ปัญหาของ `listdata-planby`:

1. **id ซ้ำ** — flight เดียวถูกแตกเป็นหลาย item
2. **จำนวนและขอบท่อนเปลี่ยนตามช่วงที่ขอ** — id 2583 ท่อน ch=1 ได้ `till = 29T09:59` ตอนขอวันเดียว แต่ได้ `29T15:00` ตอนขอทั้งสัปดาห์
3. **`since`/`till` ผิด** — เช่น id 2582 (STA `27T17:00Z`, STD `28T22:00Z`) มีท่อน `since = 27T10:00Z` ซึ่ง = STA − 7 ชม. และ `till = 28T15:00Z` = STD − 7 ชม.
   ดูเหมือนเอาเวลา UTC ไปลบ offset +7 ซ้ำอีกรอบ

`listdata` ถูกต้อง: 1 flight = 1 item, STA/STD ตรง, ผลตรงกันไม่ว่าจะขอวันเดียวหรือทั้งสัปดาห์

ข้อมูลต้นทาง (ทั้ง 2 endpoint): `TEST123` (id 2531, 2532, 2533) มี STD อยู่ก่อน STA

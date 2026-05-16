# FNB Dashboard API Body Reference

Use snake_case request and response keys for `ipd/fnbdashboard` APIs.

## Standard request keys

- `site_id`
- `page`
- `limit`
- `search`
- `diet_type`
- `location_id`
- `from_date`
- `to_date`
- `mr_no`

## Accepted alternate request keys

These legacy keys are still accepted where the service already supports them:

- `SITEID`, `siteid` for `site_id`
- `sdate`, `fromdate`, `fromDate` for `from_date`
- `edate`, `todate`, `toDate` for `to_date`
- `query` for `search`
- `mrn` for `mr_no`

## Common pagination response

Paginated JSON APIs return:

```json
{
  "total": 0,
  "page": 1,
  "limit": 10,
  "total_pages": 0,
  "data": []
}
```

## 1. Ward diet order

`POST /ipd/fnbdashboard/diet-order`

### Standard body

```json
{
  "site_id": 1,
  "page": 1,
  "limit": 20,
  "search": ""
}
```

### Alternate body

```json
{
  "SITEID": 1,
  "page": 1,
  "limit": 20,
  "search": "PREMIUM"
}
```

### Response data row

```json
{
  "ward": "PREMIUM BEDS - 10F - CD",
  "nbm_total": 0,
  "sd_total": 0,
  "liquid_total": 0,
  "tube_feed_total": 0,
  "full_diet_total": 0,
  "total_diet_order": 0,
  "punched_order_total": 0,
  "pending_punch_total": 0
}
```

## 2. Ward diet order CSV

`POST /ipd/fnbdashboard/diet-order/download`

```json
{
  "site_id": 1,
  "search": ""
}
```

## 3. Diet sheet

`POST /ipd/fnbdashboard/diet-sheet`

### Standard body

```json
{
  "site_id": 1,
  "page": 1,
  "limit": 20,
  "search": "",
  "diet_type": 17129481,
  "location_id": "all"
}
```

### All diet types

```json
{
  "site_id": 1,
  "page": 1,
  "limit": 20,
  "search": "",
  "location_id": "all"
}
```

### Ward/location filter

```json
{
  "site_id": 1,
  "page": 1,
  "limit": 20,
  "location_id": "location_uuid_here"
}
```

### Response data row

```json
{
  "mr_no": "10002026571197",
  "patient_name": "MR DINESH RAMNIKLAL RATHOD",
  "bed_no": "1031",
  "ward": "PREMIUM BEDS - 10F - CD",
  "diet_name": "SOFT DIET",
  "nursing_remark": "PATIENT CAN TAKE FULL DIET",
  "diet_remark": "LESS OIL",
  "em": "",
  "breakfast": "",
  "mid_morning": "",
  "lunch": "",
  "two_pm": "",
  "evening_tea": "",
  "six_pm": "",
  "dinner": "",
  "bed_time": ""
}
```

## 4. Diet sheet CSV

`POST /ipd/fnbdashboard/diet-sheet/download`

```json
{
  "site_id": 1,
  "diet_type": 17129481,
  "location_id": "all",
  "search": ""
}
```

## 5. Liquid diet sheet

`POST /ipd/fnbdashboard/diet-sheet-liquids`

### Standard body

```json
{
  "site_id": 1,
  "page": 1,
  "limit": 20,
  "search": "",
  "diet_type": 17129492,
  "location_id": "all"
}
```

### All liquid diet types

```json
{
  "site_id": 1,
  "page": 1,
  "limit": 20,
  "search": "",
  "location_id": "all"
}
```

### Response data row

```json
{
  "mr_no": "10002026571197",
  "patient_name": "MR DINESH RAMNIKLAL RATHOD",
  "bed_no": "1031",
  "ward": "PREMIUM BEDS - 10F - CD",
  "diet_name": "LIQUID DIET",
  "nursing_remark": "NURSE REMARK",
  "diet_remark": "DIET REMARK"
}
```

## 6. Liquid diet sheet CSV

`POST /ipd/fnbdashboard/diet-sheet-liquids/download`

```json
{
  "site_id": 1,
  "diet_type": 17129492,
  "location_id": "all",
  "search": ""
}
```

## 7. Pending diet orders

`POST /ipd/fnbdashboard/pending-diet-orders`

### Standard body

```json
{
  "site_id": 1,
  "search": ""
}
```

### Alternate body

```json
{
  "siteid": 1,
  "search": "1031"
}
```

### Response

```json
{
  "total": 1,
  "data": [
    {
      "ward": "PREMIUM BEDS - 10F - CD",
      "bed_no": "1031",
      "mr_no": "10002026571197",
      "patient_name": "MR DINESH RAMNIKLAL RATHOD",
      "admission_date_only": "2026-05-16",
      "admission_date": "2026-05-16 14:15",
      "doctor": "DR NAME",
      "patient_id": 1364794
    }
  ]
}
```

## 8. Extra orders

`POST /ipd/fnbdashboard/extra-orders`

### Standard datewise body

```json
{
  "site_id": 1,
  "from_date": "2026-05-16",
  "to_date": "2026-05-16",
  "page": 1,
  "limit": 20,
  "search": ""
}
```

### Alternate body

```json
{
  "siteid": 1,
  "sdate": "2026-05-16",
  "edate": "2026-05-16",
  "page": 1,
  "limit": 20
}
```

### Response data row

```json
{
  "mr_no": "10002026571197",
  "patient_name": "MR DINESH RAMNIKLAL RATHOD",
  "age_gender": "54/M",
  "admission_no": "AD1000260401778",
  "ho_date": "16/05/2026 14:15",
  "menu_detail": "EXTRA ORDER",
  "admission_date": "16/05/2026 08:00",
  "bed_no": "1031",
  "ward": "PREMIUM BEDS - 10F - CD",
  "doctor": "DR NAME",
  "mobile_no": "9876543210",
  "username": "user",
  "diet_name": "EXTRA ORDER",
  "nursing_remark": "NURSE REMARK",
  "diet_remark": "DIET REMARK",
  "punch_date": "16/05/2026 14:30",
  "nursing_user": "user"
}
```

## 9. Extra orders CSV

`POST /ipd/fnbdashboard/extra-orders/download`

```json
{
  "site_id": 1,
  "from_date": "16-05-2026",
  "to_date": "16-05-2026",
  "search": ""
}
```

## 10. Liquid data

`POST /ipd/fnbdashboard/liquid-data`

### Standard datewise body

Use `DD-MM-YYYY` date format for this API.

```json
{
  "site_id": 1,
  "from_date": "16-05-2026",
  "to_date": "16-05-2026",
  "page": 1,
  "limit": 20,
  "search": ""
}
```

### Fetch all rows

```json
{
  "site_id": 1,
  "from_date": "16-05-2026",
  "to_date": "16-05-2026",
  "page": 1,
  "limit": -1
}
```

### Alternate body

```json
{
  "SITEID": 1,
  "fromdate": "16-05-2026",
  "todate": "16-05-2026",
  "page": 1,
  "limit": 20
}
```

### Response data row

```json
{
  "ho_date": "16/05/2026 14:15",
  "po_id": "0b1e3bfc-668d-42b8-bf17-ade76b16f430",
  "diet_remark": "DIET REMARK",
  "nursing_remark": "NURSE REMARK",
  "mr_no": "10002026571197",
  "patient_name": "MR DINESH RAMNIKLAL RATHOD",
  "bed_no": "1031",
  "ward": "PREMIUM BEDS - 10F - CD",
  "liquid_time": 8,
  "doctor": "DR NAME",
  "admission_date": "16/05/2026 08:00",
  "remarks": "-",
  "liquid_detail_id": "liquid_detail_uuid",
  "username": "user",
  "admission_no": "AD1000260401778",
  "menu": "LIQUID",
  "menu_detail": "LIQUID DETAIL",
  "punch_date": "16/05/2026 14:30"
}
```

## 11. Liquid data CSV

`POST /ipd/fnbdashboard/liquid-data/download`

```json
{
  "site_id": 1,
  "from_date": "16-05-2026",
  "to_date": "16-05-2026",
  "search": ""
}
```

## 12. Search patient

`POST /ipd/fnbdashboard/search-patient`

### Standard body

```json
{
  "search": "10002026571197"
}
```

### Alternate body

```json
{
  "query": "DINESH"
}
```

### Response data row

```json
{
  "label": "10002026571197 | MR DINESH RAMNIKLAL RATHOD",
  "mr_no": "10002026571197",
  "patient_id": 1364794,
  "patient_name": "MR DINESH RAMNIKLAL RATHOD"
}
```

## 13. Patient order ledger

`POST /ipd/fnbdashboard/patient-order-ledger`

### Standard body

```json
{
  "mr_no": "10002026571197"
}
```

### Alternate body

```json
{
  "mrn": "10002026571197"
}
```

### Response data row

```json
{
  "site_id": "1",
  "mr_no": "10002026571197",
  "patient_id": 1364794,
  "patient_name": "MR DINESH RAMNIKLAL RATHOD",
  "age_gender": "54/M",
  "menu_detail": "SOFT DIET",
  "admission_date": "2026-05-16T08:00:00.000Z",
  "bed_no": "1031",
  "ward": "PREMIUM BEDS - 10F - CD",
  "doctor": "DR NAME",
  "username": "user",
  "diet_name": "SOFT DIET",
  "nursing_remark": "NURSE REMARK",
  "diet_remark": "DIET REMARK",
  "ho_date": "2026-05-16T14:15:00.000Z",
  "punch_date": "2026-05-16T14:30:00.000Z",
  "diff": 15,
  "diet_type": 17129481,
  "dispatched": false,
  "is_cancelled": false,
  "is_diet_change": false,
  "is_transfer": false,
  "order_status": true,
  "liquid_hours": 0
}
```

## 14. Diet types

`GET /ipd/fnbdashboard/diet-types`

No request body.

### Response data row

```json
{
  "value": 17129481,
  "label": "SOFT DIET"
}
```

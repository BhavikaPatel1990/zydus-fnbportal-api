# HINAI Order API Body Reference

Use these standard request body keys everywhere in `ipd/hinaiorders` APIs.

## Standard keys

- `site_id`
- `patient_id`
- `mr_no`
- `admission_no`
- `hinai_order_id`
- `hinai_order_ids`
- `po_id`
- `diet_type`
- `menu_id`
- `menu_ids`
- `order_type`
- `view_data`
- `list_type`
- `page`
- `limit`
- `search`
- `ward`
- `bed_no`
- `liquid_hours`
- `remarks`
- `from_date`
- `to_date`

## Standard values

`order_type`

- `regular`
- `extra`
- `liquids`
- `all`

`view_data`

- `today`
- `all`

`list_type`

- `hinai`
- `ordered`

## Sample IDs

Use these same sample values in all examples below:

```json
{
  "site_id": 1,
  "patient_id": 1364794,
  "mr_no": "10002026571197",
  "admission_no": "AD1000260401778",
  "hinai_order_id": 62425697,
  "po_id": "0b1e3bfc-668d-42b8-bf17-ade76b16f430",
  "menu_id": "3d203e1b-31f7-45bc-a410-133373de5f3f",
  "ward": "PREMIUM BEDS - 10F - CD"
}
```

## 1. Create HINAI order

`POST /ipd/hinaiorders`

```json
{
  "site_id": 1,
  "patient_id": 1364794,
  "mr_no": "10002026571197",
  "patient_name": "Mr Dinesh Ramniklal Rathod",
  "admission_no": "AD1000260401778",
  "admission_at": "2026-05-16T08:00:00.000Z",
  "bed_no": "1031",
  "ward": "PREMIUM BEDS - 10F - CD",
  "doctor": "Dr. Dipak Patel / Dr. Ravi Chauhan",
  "menu": "NORMAL",
  "menu_detail": "6PM- TEA TEST DDSF",
  "order_date": "2026-05-16T14:15:00.000Z",
  "diet_type": 17129481,
  "hinai_order_id": 62425697,
  "nurse_remark": "PATIENT CAN TAKE FULL DIET TEST",
  "age_gender": "54/M",
  "mobile_no": "9876543210",
  "email": "test@example.com"
}
```

## 2. Update transfer

`PUT /ipd/hinaiorders/transfer`

```json
{
  "patient_id": 1364794,
  "bed_no": "1032",
  "ward": "PREMIUM BEDS - 10F - CD"
}
```

## 3. Update discharge

`PUT /ipd/hinaiorders/discharge`

```json
{
  "patient_id": 1364794,
  "admission_no": "AD1000260401778"
}
```

## 4. HINAI order list

`POST /ipd/hinaiorders/list`

### Today regular

```json
{
  "site_id": 1,
  "view_data": "today",
  "order_type": "regular",
  "list_type": "hinai",
  "page": 1,
  "limit": 20,
  "search": ""
}
```

### Today extra

```json
{
  "site_id": 1,
  "view_data": "today",
  "order_type": "extra",
  "list_type": "hinai",
  "page": 1,
  "limit": 20,
  "search": ""
}
```

### Today liquids

```json
{
  "site_id": 1,
  "view_data": "today",
  "order_type": "liquids",
  "list_type": "hinai",
  "page": 1,
  "limit": 20,
  "search": ""
}
```

### All date regular

```json
{
  "site_id": 1,
  "view_data": "all",
  "order_type": "regular",
  "list_type": "hinai",
  "page": 1,
  "limit": 20,
  "search": ""
}
```

### Ordered list regular

```json
{
  "site_id": 1,
  "view_data": "today",
  "order_type": "regular",
  "list_type": "ordered",
  "page": 1,
  "limit": 20,
  "search": ""
}
```

## 5. Refresh orders

`POST /ipd/hinaiorders/refresh-orders`

```json
{}
```

## 6. Order summary

`POST /ipd/hinaiorders/order-summary`

### Today regular

```json
{
  "site_id": 1,
  "view_data": "today",
  "order_type": "regular"
}
```

### Today extra

```json
{
  "site_id": 1,
  "view_data": "today",
  "order_type": "extra"
}
```

### Today all

```json
{
  "site_id": 1,
  "view_data": "today",
  "order_type": "all"
}
```

### All date all

```json
{
  "site_id": 1,
  "view_data": "all",
  "order_type": "all"
}
```

## 7. Menu details

`POST /ipd/hinaiorders/menu-details`

### Regular

```json
{
  "patient_id": 1364794,
  "hinai_order_id": 62425697,
  "diet_type": 17129481
}
```

### Extra

```json
{
  "patient_id": 1364794,
  "hinai_order_id": 62425697,
  "diet_type": 18894123
}
```

## 8. Order details

`POST /ipd/hinaiorders/order-details`

```json
{
  "patient_id": 1364794,
  "hinai_order_id": 62425697
}
```

## 9. Nursing remarks

`POST /ipd/hinaiorders/nursing-remarks`

```json
{
  "patient_id": 1364794,
  "hinai_order_id": 62425697
}
```

## 10. Patient order form

`POST /ipd/hinaiorders/patient-order/form`

### Regular

```json
{
  "patient_id": 1364794,
  "hinai_order_id": 62425697,
  "diet_type": 17129481,
  "po_id": "0b1e3bfc-668d-42b8-bf17-ade76b16f430"
}
```

### Extra

```json
{
  "patient_id": 1364794,
  "hinai_order_id": 62425697,
  "diet_type": 18894123,
  "po_id": "0b1e3bfc-668d-42b8-bf17-ade76b16f430"
}
```

## 11. Create patient order

`POST /ipd/hinaiorders/patient-order`

### Regular standard body

```json
{
  "patient_id": 1364794,
  "hinai_order_id": 62425697,
  "diet_type": 17129481,
  "po_id": "0b1e3bfc-668d-42b8-bf17-ade76b16f430",
  "diet_remark": "LESS OIL",
  "nursing_remark": "PATIENT CAN TAKE FULL DIET",
  "items": [
    {
      "menu_id": "3d203e1b-31f7-45bc-a410-133373de5f3f",
      "remarks": "6PM- TEA TEST DDSF"
    }
  ]
}
```

### Regular alternate compact body

```json
{
  "patient_id": 1364794,
  "hinai_order_id": 62425697,
  "diet_type": 17129481,
  "diet_remark": "LESS OIL",
  "nursing_remark": "PATIENT CAN TAKE FULL DIET",
  "menu_ids": ["3d203e1b-31f7-45bc-a410-133373de5f3f"],
  "remarks": ["6PM- TEA TEST DDSF"]
}
```

### Extra standard body

```json
{
  "patient_id": 1364794,
  "hinai_order_id": 62425697,
  "diet_type": 18894123,
  "po_id": "0b1e3bfc-668d-42b8-bf17-ade76b16f430",
  "diet_remark": "EXTRA ORDER REMARK",
  "nursing_remark": "EXTRA ORDER",
  "items": [
    {
      "menu_id": "3d203e1b-31f7-45bc-a410-133373de5f3f",
      "remarks": "EXTRA ITEM"
    }
  ]
}
```

### Extra alternate compact body

```json
{
  "patient_id": 1364794,
  "hinai_order_id": 62425697,
  "diet_type": 18894123,
  "diet_remark": "EXTRA ORDER REMARK",
  "nursing_remark": "EXTRA ORDER",
  "menu_ids": ["3d203e1b-31f7-45bc-a410-133373de5f3f"],
  "remarks": ["EXTRA ITEM"]
}
```

## 12. Liquid order form

`POST /ipd/hinaiorders/patient-order-liquid/form`

```json
{
  "patient_id": 1364794,
  "hinai_order_id": 62425697,
  "diet_type": 17129492,
  "po_id": "0b1e3bfc-668d-42b8-bf17-ade76b16f430"
}
```

## 13. Liquid timings

`POST /ipd/hinaiorders/patient-order-liquid/timings`

### Standard body

```json
{
  "patient_id": 1364794,
  "liquid_hours": 2
}
```

### Alternate body

```json
{
  "patient_id": 1364794,
  "liquid_hours": 3
}
```

## 14. Create liquid patient order

`POST /ipd/hinaiorders/patient-order-liquid`

### Standard body

```json
{
  "patient_id": 1364794,
  "hinai_order_id": 62425697,
  "diet_type": 17129492,
  "po_id": "0b1e3bfc-668d-42b8-bf17-ade76b16f430",
  "liquid_hours": 2,
  "diet_remark": "LIQUID REMARK",
  "nursing_remark": "NURSE REMARK",
  "timings": [
    {
      "liquid_time": 8,
      "remarks": "FIRST"
    },
    {
      "liquid_time": 10,
      "remarks": "SECOND"
    }
  ]
}
```

### Alternate compact body

```json
{
  "patient_id": 1364794,
  "hinai_order_id": 62425697,
  "diet_type": 17129492,
  "liquid_hours": 2,
  "diet_remark": "LIQUID REMARK",
  "nursing_remark": "NURSE REMARK",
  "liquid_times": [8, 10],
  "liquid_remarks": ["FIRST", "SECOND"]
}
```

## 15. Check lock

`POST /ipd/hinaiorders/check-lock`

```json
{
  "page_id": 1,
  "patient_id": 1364794
}
```

## 16. Release lock

`POST /ipd/hinaiorders/release-lock`

```json
{
  "page_id": 1,
  "patient_id": 1364794
}
```

## 17. Update diagnosis

`POST /ipd/hinaiorders/update-diagnosis`

```json
{
  "patient_id": 1364794,
  "mr_no": "10002026571197",
  "hinai_order_id": 62425697,
  "new_diagnosis_value": "UPDATED DIAGNOSIS"
}
```

## 18. Dispatch patient order

`POST /ipd/hinaiorders/dispatch`

```json
{
  "po_id": "0b1e3bfc-668d-42b8-bf17-ade76b16f430"
}
```

## 19. Cancel patient order

`POST /ipd/hinaiorders/cancel`

```json
{
  "po_id": "0b1e3bfc-668d-42b8-bf17-ade76b16f430"
}
```

## 20. Mark OUT

`POST /ipd/hinaiorders/out`

### Single order

```json
{
  "hinai_order_id": "62425697",
  "remarks": "OUT DONE"
}
```

### Multiple orders alternate body

```json
{
  "hinai_order_id": "62425697|62425698",
  "remarks": "OUT DONE"
}
```

## 21. Clearance

`POST /ipd/hinaiorders/clearance`

### Single order

```json
{
  "hinai_order_ids": "62425697"
}
```

### Multiple orders alternate body

```json
{
  "hinai_order_ids": "62425697|62425698"
}
```

## 22. Wards

`POST /ipd/hinaiorders/wards`

```json
{
  "site_id": 1
}
```

## 23. Order menu list with print status

`POST /ipd/hinaiorders/order-menu-list`

### Regular

```json
{
  "patient_id": 1364794,
  "diet_type": 17129481,
  "hinai_order_id": 62425697,
  "order_type": "regular"
}
```

### Extra

```json
{
  "patient_id": 1364794,
  "diet_type": 18894123,
  "hinai_order_id": 62425697,
  "order_type": "extra"
}
```

### Liquids

```json
{
  "patient_id": 1364794,
  "diet_type": 17129492,
  "hinai_order_id": 62425697,
  "order_type": "liquids"
}
```

## 24. Export orders CSV

`POST /ipd/hinaiorders/export/orders`

### Today regular

```json
{
  "site_id": 1,
  "item": "regular"
}
```

### Today extra

```json
{
  "site_id": 1,
  "item": "extra"
}
```

### Alternate body using order_type

```json
{
  "site_id": 1,
  "order_type": "regular"
}
```

## 25. Export OUT all CSV

`POST /ipd/hinaiorders/export/out-all`

### Same-day datewise

```json
{
  "site_id": 1,
  "from_date": "2026-05-16",
  "to_date": "2026-05-16"
}
```

### Multi-day datewise alternate body

```json
{
  "site_id": 1,
  "from_date": "2026-05-01",
  "to_date": "2026-05-16"
}
```

## 26. Print single sticker

`POST /ipd/hinaiorders/print/sticker`

### Regular

```json
{
  "patient_id": 1364794,
  "diet_type": 17129481,
  "hinai_order_id": 62425697,
  "po_id": "0b1e3bfc-668d-42b8-bf17-ade76b16f430",
  "menu_id": "3d203e1b-31f7-45bc-a410-133373de5f3f"
}
```

### Extra

```json
{
  "patient_id": 1364794,
  "diet_type": 18894123,
  "hinai_order_id": 62425697,
  "po_id": "0b1e3bfc-668d-42b8-bf17-ade76b16f430",
  "menu_id": "3d203e1b-31f7-45bc-a410-133373de5f3f"
}
```

## 27. Print bulk stickers

`POST /ipd/hinaiorders/print/bulk-stickers`

### Today regular wardwise

```json
{
  "site_id": 1,
  "ward": "PREMIUM BEDS - 10F - CD",
  "item": "regular",
  "menu_id": "3d203e1b-31f7-45bc-a410-133373de5f3f"
}
```

### Today extra wardwise

```json
{
  "site_id": 1,
  "ward": "PREMIUM BEDS - 10F - CD",
  "item": "extra",
  "menu_id": "3d203e1b-31f7-45bc-a410-133373de5f3f"
}
```

### Today regular all menu alternate body

```json
{
  "site_id": 1,
  "ward": "PREMIUM BEDS - 10F - CD",
  "item": "regular"
}
```

## 28. Print liquid stickers

`POST /ipd/hinaiorders/print/liquid-stickers`

### Today specific liquid time

```json
{
  "site_id": 1,
  "menu_id": 8
}
```

### Today all liquid times alternate body

```json
{
  "site_id": 1
}
```

## 29. Print all stickers

`POST /ipd/hinaiorders/print/all-stickers`

This route uses the same bulk sticker logic and prints multiple stickers as a multi-page PDF.

### Today regular by legacy meal id

```json
{
  "site_id": 1,
  "item": "regular",
  "menu_id": 2
}
```

Legacy meal mapping:

- `2` = `Breakfast`
- `3` = `MM`
- `4` = `Lunch`
- `5` = `2PM`
- `6` = `EveTea`
- `7` = `6PM`
- `8` = `Dinner`

### Today regular all meals

```json
{
  "site_id": 1,
  "item": "regular",
  "menu_id": "all"
}
```

### Today regular wardwise

```json
{
  "site_id": 1,
  "item": "regular",
  "menu_id": 2,
  "ward": "PREMIUM BEDS - 10F - CD"
}
```

### Today extra all stickers

```json
{
  "site_id": 1,
  "item": "extra",
  "menu_id": "all"
}
```

### Today extra by menu UUID

```json
{
  "site_id": 1,
  "item": "extra",
  "menu_id": "3d203e1b-31f7-45bc-a410-133373de5f3f"
}
```

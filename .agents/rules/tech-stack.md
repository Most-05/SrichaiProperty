# Next.js 16, React 19 & Modern Stack Conventions

## 1. Next.js 16 App Router Breaking Changes
- **Asynchronous Parameters**: ใน `page.tsx`, `layout.tsx`, และ Route Handlers (`route.ts`) ตัวแปร `params` และ `searchParams` ถูกส่งมาเป็น `Promise` เสมอ
  - ❌ **ห้ามเขียน**: `const { id } = props.params;` (จะทำให้เกิด runtime warning/error ทันที)
  - ✅ **ถูกต้อง (Server Component / Route Handler)**:
    ```typescript
    export default async function Page({
      params,
      searchParams,
    }: {
      params: Promise<{ id: string }>;
      searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
    }) {
      const { id } = await params;
      const query = await searchParams;
      // ...
    }
    ```
  - ✅ **ถูกต้อง (Client Component ด้วย React 19 `use()`)**:
    ```typescript
    'use client';
    import { use } from 'react';
    export default function Page({ params }: { params: Promise<{ id: string }> }) {
      const { id } = use(params);
      // ...
    }
    ```

## 2. Server vs Client Component Guidelines
- **Server First**: เริ่มต้นเขียนทุกหน้าและคอมโพเนนต์เป็น **Server Component** เสมอ
- **When to use `'use client'`**:
  - ใช้ state (`useState`, `useReducer`)
  - ใช้ lifecycle หรือ side effects (`useEffect`, `useLayoutEffect`)
  - มี Event Listeners (`onClick`, `onChange`, `onSubmit`)
  - ใช้งาน Browser APIs (`window`, `localStorage`, `navigator`)
  - ใช้งาน Realtime Clients (Pusher listener) หรือ แผนที่ Interactive (Leaflet)
- **Direct Data Fetching in Server Components**:
  - ดึงข้อมูลจากฐานข้อมูลโดยตรงผ่าน `db` (Prisma) ใน Server Component ได้เลย
  - ❌ **ห้าม**: เขียน Server Component ไป `fetch('/api/...')` ของระบบตัวเอง เพราะเพิ่ม overhead ของเครือข่ายโดยไม่จำเป็น

## 3. Tailwind CSS v4 & Styling Rules
- โปรเจกต์นี้ใช้ **Tailwind CSS v4** (`@tailwindcss/postcss`) ร่วมกับ `@import "tailwindcss";` ใน `app/globals.css`
- ❌ **ห้ามสร้างหรือแก้ไข `tailwind.config.js` หรือ `tailwind.config.ts`** เพราะ v4 ใช้ CSS-first configuration
- คอนฟิกตัวแปรสี โทนสี และฟอนต์ถูกนิยามไว้ใน `@theme inline` และตัวแปร CSS `:root` / `.dark`
- ใช้ Semantic Token เสมอ:
  - สีพื้นหลัง: `bg-background`, `bg-card`, `bg-muted`, `bg-popover`
  - สีตัวอักษร: `text-foreground`, `text-muted-foreground`, `text-primary`
  - สีขอบและอินพุต: `border-border`, `ring-ring`
  - สีสถานะ: `text-destructive`, `bg-destructive/10`

## 4. Third-Party Client Libraries (Leaflet & Browser-only APIs)
- Leaflet (`leaflet`, `react-leaflet`) เรียกใช้ `window` ซึ่งไม่สามารถรันบน Server ได้
- การเรียกใช้แผนที่ต้องทำผ่าน `next/dynamic` พร้อมปิด SSR เสมอ:
  ```typescript
  import dynamic from 'next/dynamic';

  const PropertyMap = dynamic(() => import('@/components/property/PropertyMap'), {
    ssr: false,
    loading: () => <div className="h-96 w-full animate-pulse bg-muted rounded-xl" />
  });
  ```

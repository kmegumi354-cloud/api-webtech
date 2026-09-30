"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CATEGORIES, ProductDraftSchema } from "@/lib/products";
import type { Product, ProductDraft } from "@/lib/products";

type ProductFormProps = {
  editing: Product | null;
  onSave: (draft: ProductDraft) => void;
  onCancel: () => void;
};

export default function ProductForm(
  { editing, onSave, onCancel }: ProductFormProps
) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid },
  } = useForm<ProductDraft>({
    resolver: zodResolver(ProductDraftSchema),
    mode: "onTouched",
    defaultValues: editing
      ? { title: editing.title, price: editing.price,
          stock: editing.stock, category: editing.category }
      : { title: "", price: undefined, stock: undefined },
  });

  function saveProduct(values: ProductDraft) {
    onSave(values);
    reset();
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit(saveProduct)} noValidate>
      <div className="field span-2">
        <label htmlFor="title">ชื่อสินค้า</label>
        <input
          id="title"
          required
          {...register("title")}
          aria-invalid={!!errors.title}
          aria-describedby="title-error"
        />
        <span className="error" id="title-error" role="alert">{errors.title?.message}</span>
      </div>

      <div className="field">
        <label htmlFor="price">ราคา</label>
        <input
          id="price"
          type="number"
          step="0.01"
          required
          {...register("price", { valueAsNumber: true })}
          aria-invalid={!!errors.price}
          aria-describedby="price-error"
        />
        <span className="error" id="price-error" role="alert">{errors.price?.message}</span>
      </div>

      <div className="field">
        <label htmlFor="stock">จำนวนคงเหลือ</label>
        <input
          id="stock"
          type="number"
          required
          {...register("stock", { valueAsNumber: true })}
          aria-invalid={!!errors.stock}
          aria-describedby="stock-error"
        />
        <span className="error" id="stock-error" role="alert">{errors.stock?.message}</span>
      </div>

      <div className="field span-2">
        <label htmlFor="category">หมวดหมู่</label>
        <select
          id="category"
          required
          {...register("category")}
          aria-invalid={!!errors.category}
          aria-describedby="category-error"
        >
          <option value="">กรุณาเลือกหมวดหมู่</option>
          {CATEGORIES.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <span className="error" id="category-error" role="alert">
          {errors.category?.message}
        </span>
      </div>

      <div className="actions span-2">
        <button
          className="btn btn-primary"
          type="submit"
          disabled={!isDirty || !isValid}
        >
          {editing ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}
        </button>
        {editing && (
          <button className="btn btn-ghost" type="button" onClick={onCancel}>ยกเลิก</button>
        )}
      </div>
    </form>
  );
}

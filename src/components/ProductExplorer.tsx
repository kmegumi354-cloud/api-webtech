"use client";

import { useEffect, useState } from "react";
import { defaultQuery, fetchProducts } from "@/lib/products";
import type {
  Product, ProductDraft, ProductList, SearchQuery,
} from "@/lib/products";
import ProductSearchForm from "./ProductSearchForm";
import ProductForm from "./ProductForm";

type LoadState = "loading" | "error" | "ready";

export default function ProductExplorer() {
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);

  function showResult(list: ProductList) {
    setProducts(list.products);
    setStatus("ready");
  }

  function showError(error: unknown) {
    setErrorMessage(
      error instanceof Error ? error.message : "เรียกข้อมูลไม่สำเร็จ"
    );
    setStatus("error");
  }

  useEffect(() => {
    fetchProducts(defaultQuery).then(showResult).catch(showError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProducts(query: SearchQuery) {
    setStatus("loading");
    setErrorMessage("");
    try {
      showResult(await fetchProducts(query));
    } catch (error) {
      showError(error);
    }
  }

  function saveProduct(draft: ProductDraft) {
    if (editing) {
      setProducts(
        products.map((item) =>
          item.id === editing.id ? { ...draft, id: editing.id } : item
        )
      );
      setEditing(null);
    } else {
      setProducts([...products, { ...draft, id: Date.now() }]);
    }
  }

  function removeProduct(id: number) {
    setProducts(products.filter((item) => item.id !== id));
    if (editing?.id === id) {
      setEditing(null);
    }
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1>รายการสินค้า</h1>
          <p className="subtitle">Product Explorer · React Hook Form + Zod + DummyJSON</p>
        </div>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => loadProducts(defaultQuery)}
          disabled={status === "loading"}
        >
          {status === "loading" ? "กำลังโหลด" : "โหลดข้อมูลใหม่"}
        </button>
      </header>

      <section className="card">
        <h2>ค้นหาสินค้า</h2>
        <ProductSearchForm onSearch={loadProducts} />
      </section>

      {/* key ทำให้ฟอร์มสร้างใหม่ และรับ defaultValues ใหม่เมื่อเปลี่ยนรายการที่แก้ไข */}
      <section className="card">
        <h2>{editing ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h2>
        <ProductForm
          key={editing?.id ?? "new"}
          editing={editing}
          onSave={saveProduct}
          onCancel={() => setEditing(null)}
        />
      </section>

      <section className="card" aria-live="polite">
        <h2>สินค้าทั้งหมด{status === "ready" && ` (${products.length})`}</h2>
        {status === "loading" && <p className="state">กำลังโหลดข้อมูล...</p>}
        {status === "error" && <p className="state state-error" role="alert">{errorMessage}</p>}
        {status === "ready" && products.length === 0 && (
          <p className="state">ไม่พบสินค้าที่ตรงกับเงื่อนไข</p>
        )}
        {status === "ready" && products.length > 0 && (
          <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ชื่อสินค้า</th><th className="num">ราคา</th>
                <th className="num">คงเหลือ</th><th>หมวดหมู่</th><th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td className="num">{item.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td className="num">
                    <span className={item.stock === 0 ? "badge badge-out" : "badge badge-ok"}>
                      {item.stock}
                    </span>
                  </td>
                  <td><span className="chip">{item.category}</span></td>
                  <td className="row-actions">
                    <button className="btn btn-sm btn-ghost" type="button" onClick={() => setEditing(item)}>
                      แก้ไข
                    </button>
                    <button className="btn btn-sm btn-danger" type="button" onClick={() => removeProduct(item.id)}>
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </section>
    </main>
  );
}

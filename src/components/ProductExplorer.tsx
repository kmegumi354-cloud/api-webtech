"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
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
  const rootRef = useRef<HTMLElement>(null);
  const prevStatus = useRef<LoadState>("loading");
  const prevCount = useRef(0);

  // แอนิเมชันเข้าจอครั้งแรก
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".page-header h1", {
        y: 40, opacity: 0, letterSpacing: "0.3em",
        duration: 1.2, ease: "expo.out",
      });
      gsap.from(".subtitle", { y: 20, opacity: 0, duration: 1, delay: 0.25, ease: "power3.out" });
      gsap.from(".page-header .btn", { scale: 0.6, opacity: 0, duration: 0.8, delay: 0.4, ease: "back.out(2)" });
      gsap.from(".card", {
        y: 60, opacity: 0, rotateX: -12, transformPerspective: 800,
        duration: 1, stagger: 0.16, delay: 0.35, ease: "power4.out",
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  // แสงสปอตไลต์ที่ตามเมาส์บนการ์ด
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    function onMove(e: PointerEvent) {
      const card = (e.target as HTMLElement).closest<HTMLElement>(".card");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    }
    root.addEventListener("pointermove", onMove);
    return () => root.removeEventListener("pointermove", onMove);
  }, []);

  // แถวในตาราง: โหลดเสร็จให้ไล่เข้าทีละแถว, เพิ่มใหม่ให้เด้งเข้ามา
  useEffect(() => {
    const root = rootRef.current;
    if (root && status === "ready") {
      if (prevStatus.current !== "ready") {
        gsap.from(root.querySelectorAll("tbody tr"), {
          y: 24, opacity: 0, duration: 0.6, stagger: 0.04, ease: "power3.out",
        });
      } else if (products.length > prevCount.current) {
        const rows = root.querySelectorAll("tbody tr");
        const last = rows[rows.length - 1];
        if (last) {
          gsap.from(last, { scale: 0.85, opacity: 0, backgroundColor: "rgba(129,140,248,0.5)", duration: 0.9, ease: "elastic.out(1, 0.6)" });
        }
      }
    }
    prevStatus.current = status;
    prevCount.current = products.length;
  }, [status, products.length]);

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
    const row = rootRef.current?.querySelector(`tr[data-id="${id}"]`);
    const remove = () => {
      setProducts((list) => list.filter((item) => item.id !== id));
      setEditing((current) => (current?.id === id ? null : current));
    };
    if (row) {
      gsap.to(row, { x: 80, opacity: 0, duration: 0.35, ease: "power2.in", onComplete: remove });
    } else {
      remove();
    }
  }

  return (
    <main ref={rootRef} className="page">
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
                <tr key={item.id} data-id={item.id}>
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

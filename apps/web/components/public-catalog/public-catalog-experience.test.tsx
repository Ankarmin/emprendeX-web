/* eslint-disable @next/next/no-img-element */

import type { ComponentPropsWithoutRef } from "react";
import { render, screen } from "@testing-library/react";
import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PublicCatalogExperience } from "./public-catalog-experience";
import type { PublicCatalogState } from "@/lib/public-catalog-types";

vi.mock("next/image", () => ({
  default: (props: ComponentPropsWithoutRef<"img">) => (
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

vi.mock("./turnstile-field", () => ({
  TurnstileField: () => null,
}));

const catalog: PublicCatalogState = {
  business: {
    id: "business-1",
    name: "Demo Studio",
    category: "Servicios creativos",
    slug: "demo-studio",
    logoUrl: null,
    colorPaletteId: "ocean",
  },
  items: [
    {
      id: "item-1",
      itemClass: "Producto",
      referenceCode: "PRD-001",
      sku: "CAFE-001",
      name: "Café Especial",
      description: "Café tostado",
      imageUrl: null,
      price: "12.00",
      stock: 5,
      unit: { id: "unit-1", name: "Bolsa" },
      category: { id: "category-1", name: "Bebidas" },
    },
    {
      id: "item-2",
      itemClass: "Servicio",
      referenceCode: "SRV-001",
      sku: null,
      name: "Branding Express",
      description: "Servicio creativo",
      imageUrl: null,
      price: "120.00",
      stock: null,
      unit: { id: "unit-2", name: "Proyecto" },
      category: { id: "category-2", name: "Diseño" },
    },
  ],
};

const catalogWithApiFieldVariants = {
  business: catalog.business,
  items: [
    {
      itemId: "legacy-item-1",
      item_class: "Producto",
      reference_code: "PRD-LEGACY-001",
      sku: null,
      name: "Miel Artesanal",
      description: null,
      image_url: null,
      price: 18,
      categoryName: "Alimentos",
      unitName: "Frasco",
    },
    {
      item_id: "legacy-item-2",
      itemClass: "Servicio",
      referenceCode: "SRV-LEGACY-001",
      sku: null,
      name: "Asesoría Rápida",
      description: null,
      imageUrl: null,
      price: "80.00",
      category_name: "Consultoría",
      unit_name: "Sesión",
      stock: null,
    },
  ],
} as unknown as PublicCatalogState;

describe("PublicCatalogExperience", () => {
  it("filters visible items by type and category", async () => {
    const user = userEvent.setup();

    render(<PublicCatalogExperience slug="demo-studio" catalog={catalog} />);

    expect(screen.getByText("Café Especial")).toBeInTheDocument();
    expect(screen.getByText("Stock: 5")).toBeInTheDocument();
    expect(screen.getByText("Branding Express")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Productos" }));

    expect(screen.getByText("Café Especial")).toBeInTheDocument();
    expect(screen.queryByText("Branding Express")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Todos" }));
    await user.click(screen.getByRole("button", { name: "Diseño" }));

    expect(screen.queryByText("Café Especial")).not.toBeInTheDocument();
    expect(screen.getByText("Branding Express")).toBeInTheDocument();
  });

  it("adds items and opens the cart", async () => {
    const user = userEvent.setup();

    render(<PublicCatalogExperience slug="demo-studio" catalog={catalog} />);

    await user.click(
      screen.getByRole("button", { name: "Agregar Café Especial" }),
    );

    expect(
      screen.getByRole("button", { name: "Aumentar Café Especial" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Abrir carrito" }));

    expect(
      screen.getByRole("heading", { name: "Tu cotización" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirmar cotización" }),
    ).toBeEnabled();
  });

  it("allows adding products when stock is not provided", async () => {
    const user = userEvent.setup();

    render(
      <PublicCatalogExperience
        slug="demo-studio"
        catalog={{
          ...catalog,
          items: [
            {
              ...catalog.items[0],
              stock: null,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Stock disponible")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Agregar Café Especial" }),
    );

    expect(
      screen.getByRole("button", { name: "Aumentar Café Especial" }),
    ).toBeInTheDocument();
  });

  it("normalizes API field variants before filtering and adding items", async () => {
    const user = userEvent.setup();

    render(
      <PublicCatalogExperience
        slug="demo-studio"
        catalog={catalogWithApiFieldVariants}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Productos" }));

    expect(screen.getByText("Miel Artesanal")).toBeInTheDocument();
    expect(screen.queryByText("Asesoría Rápida")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Agregar Miel Artesanal" }),
    );
    await user.click(screen.getByRole("button", { name: "Abrir carrito" }));

    const cartHeading = screen.getByRole("heading", { name: "Tu cotización" });

    expect(cartHeading).toBeInTheDocument();
    expect(
      within(cartHeading.closest("aside") ?? document.body).getByText(
        "Miel Artesanal",
      ),
    ).toBeInTheDocument();
  });
});

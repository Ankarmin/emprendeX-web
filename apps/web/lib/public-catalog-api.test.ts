import { describe, expect, it } from "vitest";
import { parsePublicCatalogState } from "./public-catalog-api";

describe("parsePublicCatalogState", () => {
  it("parses a valid public catalog payload", () => {
    const catalog = parsePublicCatalogState({
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
          sku: "CAF-001",
          name: "Cafe Especial",
          description: "Cafe tostado",
          imageUrl: null,
          price: "12.00",
          stock: 5,
          unit: {
            id: "unit-1",
            name: "Bolsa",
          },
          category: {
            id: "category-1",
            name: "Bebidas",
          },
        },
      ],
    });

    expect(catalog.business.slug).toBe("demo-studio");
    expect(catalog.items[0]?.stock).toBe(5);
  });

  it("throws when required item identifiers are missing", () => {
    expect(() =>
      parsePublicCatalogState({
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
            itemClass: "Producto",
            referenceCode: "PRD-001",
            name: "Cafe Especial",
            description: null,
            imageUrl: null,
            price: "12.00",
            stock: 5,
            unit: {
              id: "unit-1",
              name: "Bolsa",
            },
            category: {
              id: "category-1",
              name: "Bebidas",
            },
          },
        ],
      }),
    ).toThrow("catalog.items[0].id no es válido");
  });
});

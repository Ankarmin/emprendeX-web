export type PublicCatalogItem = {
  id: string;
  itemClass: "Producto" | "Servicio";
  referenceCode: string;
  sku: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: string;
  stock: number | null;
  unit: { id: string; name: string };
  category: { id: string; name: string };
};

export type PublicCatalogState = {
  business: {
    id: string;
    name: string;
    category: string;
    slug: string;
    logoUrl: string | null;
    colorPaletteId:
      | "violet"
      | "ocean"
      | "forest"
      | "ember"
      | "rose"
      | "slate"
      | "graphite"
      | "sand";
  };
  items: PublicCatalogItem[];
};

export type PublicCatalogProfile = {
  businessName: string;
  businessCategory: string;
  publicCatalogSlug: string;
  logoUrl: string | null;
  colorPaletteId:
    | "violet"
    | "ocean"
    | "forest"
    | "ember"
    | "rose"
    | "slate"
    | "graphite"
    | "sand";
};

export type PublicCatalogFunctionItem = {
  id: string;
  itemClass: "Producto" | "Servicio";
  referenceCode: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  categoryName: string;
  unitName: string;
  stock: number | null;
};

export type SubmitPublicQuotationPayload = {
  customer: {
    mode: "new" | "existing";
    dni: string;
    firstNames?: string;
    lastNames?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  items: Array<{
    itemId: string;
    quantity: number;
  }>;
  description?: string;
  deliveryDate: string;
  deliveryMethod: "Entrega a domicilio" | "Recojo en tienda";
  turnstileToken?: string;
};

export type SubmitPublicQuotationResponse = {
  quotationId: string;
  referenceCode: string;
  origin: "Catálogo público";
  total: string;
};

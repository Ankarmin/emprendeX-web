import type {
  PublicCatalogState,
  SubmitPublicQuotationPayload,
  SubmitPublicQuotationResponse,
} from "./public-catalog-types";

type ApiErrorPayload = {
  message?: string | string[];
};

export class PublicCatalogApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function getApiBaseUrl() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL no esta configurada");
  }

  return apiBaseUrl.replace(/\/+$/, "");
}

async function requestPublicApi<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const rawBody = await response.text();
  const payload = rawBody ? (JSON.parse(rawBody) as unknown) : null;

  if (!response.ok) {
    throw new PublicCatalogApiError(
      getApiErrorMessage(payload),
      response.status,
    );
  }

  return payload as T;
}

function getApiErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("message" in payload)) {
    return "No se pudo completar la solicitud.";
  }

  const message = (payload as ApiErrorPayload).message;

  if (Array.isArray(message)) {
    return message[0] ?? "No se pudo completar la solicitud.";
  }

  return message ?? "No se pudo completar la solicitud.";
}

export function isPublicCatalogApiError(
  error: unknown,
): error is PublicCatalogApiError {
  return error instanceof PublicCatalogApiError;
}

export async function fetchPublicCatalog(slug: string) {
  const payload = await requestPublicApi<unknown>(`/catalogo-publico/${slug}`);

  return parsePublicCatalogState(payload);
}

export function submitPublicQuotation(
  slug: string,
  payload: SubmitPublicQuotationPayload,
) {
  return requestPublicApi<SubmitPublicQuotationResponse>(
    `/catalogo-publico/${slug}/cotizaciones`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function parsePublicCatalogState(payload: unknown): PublicCatalogState {
  const catalog = asRecord(payload);
  const business = asRecord(catalog.business);

  return {
    business: {
      id: requiredString(business.id, "catalog.business.id"),
      name: requiredString(business.name, "catalog.business.name"),
      category: requiredString(business.category, "catalog.business.category"),
      slug: requiredString(business.slug, "catalog.business.slug"),
      logoUrl: optionalString(business.logoUrl),
      colorPaletteId: parseColorPaletteId(business.colorPaletteId),
    },
    items: requiredArray(catalog.items, "catalog.items").map((item, index) =>
      parsePublicCatalogItem(item, index),
    ),
  };
}

function parsePublicCatalogItem(payload: unknown, index: number) {
  const item = asRecord(payload);
  const category = asRecord(item.category);
  const unit = asRecord(item.unit);
  const path = `catalog.items[${index}]`;

  return {
    id: requiredString(item.id, `${path}.id`),
    itemClass: parseItemClass(item.itemClass, `${path}.itemClass`),
    referenceCode: requiredString(item.referenceCode, `${path}.referenceCode`),
    sku: optionalString(item.sku),
    name: requiredString(item.name, `${path}.name`),
    description: optionalString(item.description),
    imageUrl: optionalString(item.imageUrl),
    price: parsePrice(item.price, `${path}.price`),
    stock: parseNullableNumber(item.stock, `${path}.stock`),
    unit: {
      id: requiredString(unit.id, `${path}.unit.id`),
      name: requiredString(unit.name, `${path}.unit.name`),
    },
    category: {
      id: requiredString(category.id, `${path}.category.id`),
      name: requiredString(category.name, `${path}.category.name`),
    },
  };
}

function parseColorPaletteId(
  value: unknown,
): PublicCatalogState["business"]["colorPaletteId"] {
  switch (value) {
    case "violet":
    case "ocean":
    case "forest":
    case "ember":
    case "rose":
    case "slate":
    case "graphite":
    case "sand":
      return value;
    default:
      throw new Error("catalog.business.colorPaletteId no es válido");
  }
}

function parseItemClass(
  value: unknown,
  path: string,
): PublicCatalogState["items"][number]["itemClass"] {
  if (value === "Producto" || value === "Servicio") {
    return value;
  }

  throw new Error(`${path} no es válido`);
}

function parsePrice(value: unknown, path: string) {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toFixed(2);
  }

  throw new Error(`${path} no es válido`);
}

function parseNullableNumber(value: unknown, path: string) {
  if (value == null) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  throw new Error(`${path} no es válido`);
}

function requiredArray(value: unknown, path: string) {
  if (Array.isArray(value)) {
    return value;
  }

  throw new Error(`${path} no es válido`);
}

function requiredString(value: unknown, path: string) {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  throw new Error(`${path} no es válido`);
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }

  throw new Error("Respuesta de catálogo público inválida");
}

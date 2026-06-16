'use client';

import Image from 'next/image';
import {
  ArrowLeft,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Wrench,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useDeferredValue, useMemo, useState } from 'react';
import { submitPublicQuotation } from '@/lib/public-catalog-api';
import type {
  PublicCatalogItem,
  PublicCatalogState,
} from '@/lib/public-catalog-types';
import { TurnstileField } from './turnstile-field';

type PublicCatalogExperienceProps = {
  slug: string;
  catalog: PublicCatalogState;
};

type FilterMode = 'Todos' | 'Producto' | 'Servicio';
type DeliveryMethod = 'Entrega a domicilio' | 'Recojo en tienda';
type Step = 'cart' | 'client-type' | 'form' | 'confirm';

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
const currencySymbol = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL?.trim() || 'S/';
const documentNumberLength = 8;

export function PublicCatalogExperience({
  slug,
  catalog,
}: PublicCatalogExperienceProps) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [filterMode, setFilterMode] = useState<FilterMode>('Todos');
  const [category, setCategory] = useState('Todas');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [stockByItemId, setStockByItemId] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [step, setStep] = useState<Step>('cart');
  const [customerMode, setCustomerMode] = useState<'new' | 'existing'>('new');
  const [customerDni, setCustomerDni] = useState('');
  const [customerFirstNames, setCustomerFirstNames] = useState('');
  const [customerLastNames, setCustomerLastNames] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    'Entrega a domicilio',
  );
  const [description, setDescription] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    referenceCode: string;
    total: string;
  } | null>(null);

  const items = useMemo(
    () =>
      catalog.items.map((item, index) => {
        const normalizedItem = normalizeCatalogItem(item, index);
        const stock = stockByItemId[normalizedItem.id];

        return stock === undefined
          ? normalizedItem
          : { ...normalizedItem, stock };
      }),
    [catalog.items, stockByItemId],
  );
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const categories = useMemo(() => {
    const pool = items.filter(
      (item) => filterMode === 'Todos' || item.itemClass === filterMode,
    );

    return ['Todas', ...Array.from(new Set(pool.map((item) => item.category.name)))];
  }, [items, filterMode]);

  const filteredItems = items
    .filter((item) => filterMode === 'Todos' || item.itemClass === filterMode)
    .filter((item) => category === 'Todas' || item.category.name === category)
    .filter((item) => {
      const searchableText = `${item.name} ${item.referenceCode} ${item.sku ?? ''} ${item.category.name}`
        .trim()
        .toLowerCase();

      return normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);
    });

  const cartItems = items
    .filter((item) => (cart[item.id] ?? 0) > 0)
    .map((item) => ({ item, quantity: cart[item.id] ?? 0 }));

  const total = cartItems.reduce(
    (sum, entry) => sum + Number(entry.item.price) * entry.quantity,
    0,
  );
  const itemCount = cartItems.reduce((sum, entry) => sum + entry.quantity, 0);

  function getMaxQuantity(item: PublicCatalogItem) {
    if (item.itemClass !== 'Producto') {
      return null;
    }

    return typeof item.stock === 'number' ? item.stock : null;
  }

  function addItem(item: PublicCatalogItem) {
    const maxQuantity = getMaxQuantity(item);

    if (maxQuantity === 0) {
      return;
    }

    setCart((current) => {
      const currentQuantity = current[item.id] ?? 0;
      const nextQuantity =
        maxQuantity == null
          ? currentQuantity + 1
          : Math.min(currentQuantity + 1, maxQuantity);

      return { ...current, [item.id]: nextQuantity };
    });
  }

  function decreaseItem(itemId: string) {
    setCart((current) => {
      const nextQuantity = (current[itemId] ?? 0) - 1;
      const next = { ...current };

      if (nextQuantity <= 0) {
        delete next[itemId];
        return next;
      }

      next[itemId] = nextQuantity;
      return next;
    });
  }

  function removeItem(itemId: string) {
    setCart((current) => {
      const next = { ...current };
      delete next[itemId];
      return next;
    });
  }

  function openCart(nextStep: Step = 'cart') {
    setError(null);
    setSuccess(null);
    setStep(nextStep);
    setIsCartOpen(true);
  }

  function goBack() {
    setError(null);
    setStep((current) => {
      if (current === 'confirm') {
        return 'form';
      }

      if (current === 'form') {
        return 'client-type';
      }

      return 'cart';
    });
  }

  function continueFromForm() {
    setError(null);

    if (!customerDni.trim() || customerDni.trim().length < documentNumberLength) {
      setError('Ingresa un DNI válido para continuar.');
      return;
    }

    if (customerMode === 'new' && !customerFirstNames.trim()) {
      setError('Ingresa los nombres del cliente nuevo para continuar.');
      return;
    }

    if (!deliveryDate) {
      setError('Selecciona una fecha estimada de entrega.');
      return;
    }

    setStep('confirm');
  }

  async function handleSubmit() {
    if (cartItems.length === 0) {
      setError('Selecciona al menos un item para continuar.');
      return;
    }

    if (turnstileSiteKey && !turnstileToken) {
      setError('Completa la verificación de seguridad antes de continuar.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await submitPublicQuotation(slug, {
        customer: {
          mode: customerMode,
          dni: customerDni.trim(),
          firstNames:
            customerMode === 'new'
              ? customerFirstNames.trim() || undefined
              : undefined,
          lastNames:
            customerMode === 'new'
              ? customerLastNames.trim() || undefined
              : undefined,
          email:
            customerMode === 'new' ? customerEmail.trim() || undefined : undefined,
          phone:
            customerMode === 'new' ? customerPhone.trim() || undefined : undefined,
          address:
            customerMode === 'new' ? customerAddress.trim() || undefined : undefined,
        },
        items: cartItems.map(({ item, quantity }) => ({
          itemId: item.id,
          quantity,
        })),
        deliveryDate: new Date(`${deliveryDate}T00:00:00`).toISOString(),
        deliveryMethod,
        description: description.trim() || undefined,
        turnstileToken: turnstileToken ?? undefined,
      });

      setSuccess({
        referenceCode: response.referenceCode,
        total: response.total,
      });
      setStockByItemId((current) => {
        const next = { ...current };

        for (const { item, quantity } of cartItems) {
          if (item.itemClass !== 'Producto' || typeof item.stock !== 'number') {
            continue;
          }

          next[item.id] = Math.max(item.stock - quantity, 0);
        }

        return next;
      });
      setCart({});
      setDescription('');
      setTurnstileToken(null);
      setTurnstileResetKey((current) => current + 1);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No se pudo enviar la cotización.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-primary text-primary-foreground shadow-sm">
        <div className="px-4 pb-3 pt-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex items-center gap-3">
              {catalog.business.logoUrl ? (
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/20 bg-white/10">
                  <Image
                    src={catalog.business.logoUrl}
                    alt={`Logo de ${catalog.business.name}`}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="44px"
                  />
                </div>
              ) : null}
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold tracking-tight">
                  {catalog.business.name}
                </h1>
                <p className="text-xs font-medium text-primary-foreground/70">
                  {catalog.business.category}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openCart('cart')}
              className="relative rounded-full p-2 transition hover:bg-white/10"
              aria-label="Abrir carrito"
            >
              <ShoppingCart className="h-6 w-6" />
              {itemCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[11px] font-semibold text-destructive-foreground">
                  {itemCount}
                </span>
              ) : null}
            </button>
          </div>

          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <label>
              <span className="sr-only">Buscar productos o servicios</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar productos o servicios..."
                className="h-10 w-full rounded-md border-0 bg-background px-3 pl-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 pointer-events-auto">
            {(['Todos', 'Producto', 'Servicio'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setFilterMode(option);
                  setCategory('Todas');
                }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
                  filterMode === option
                    ? 'bg-background text-foreground shadow-sm'
                    : 'bg-white/10 text-white/85 hover:bg-white/15'
                }`}
                aria-pressed={filterMode === option}
              >
                {option === 'Todos' ? 'Todos' : `${option}s`}
              </button>
            ))}
          </div>

        </div>
      </header>

      {categories.length > 1 ? (
        <div className="border-b bg-background/95 backdrop-blur pointer-events-auto">
          <div className="flex flex-wrap gap-2 px-4 py-2.5">
            {categories.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCategory(option)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ${
                  category === option
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground'
                }`}
                aria-pressed={category === option}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <main className="px-3 pt-3">

        <div className="grid grid-cols-3 items-stretch gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6" suppressHydrationWarning>
          {filteredItems.map((item, index) => (
            <CatalogTile
              key={item.id}
              item={item}
              quantity={cart[item.id] ?? 0}
              isPriority={index < 6}
              onAdd={() => addItem(item)}
              onDecrease={() => decreaseItem(item.id)}
            />
          ))}
        </div>

        {filteredItems.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Sin resultados
          </p>
        ) : null}
      </main>

      {isCartOpen ? (
        <CartDrawer
          cartItems={cartItems}
          customerAddress={customerAddress}
          customerDni={customerDni}
          customerEmail={customerEmail}
          customerFirstNames={customerFirstNames}
          customerLastNames={customerLastNames}
          customerMode={customerMode}
          customerPhone={customerPhone}
          deliveryDate={deliveryDate}
          deliveryMethod={deliveryMethod}
          description={description}
          error={error}
          isSubmitting={isSubmitting}
          step={step}
          success={success}
          total={total}
          turnstileResetKey={turnstileResetKey}
          onAdd={addItem}
          onBack={goBack}
          onClose={() => setIsCartOpen(false)}
          onContinueFromForm={continueFromForm}
          onCustomerAddressChange={setCustomerAddress}
          onCustomerDniChange={setCustomerDni}
          onCustomerEmailChange={setCustomerEmail}
          onCustomerFirstNamesChange={setCustomerFirstNames}
          onCustomerLastNamesChange={setCustomerLastNames}
          onCustomerModeChange={setCustomerMode}
          onCustomerPhoneChange={setCustomerPhone}
          onDecrease={decreaseItem}
          onDeliveryDateChange={setDeliveryDate}
          onDeliveryMethodChange={setDeliveryMethod}
          onDescriptionChange={setDescription}
          onRemove={removeItem}
          onStepChange={setStep}
          onSubmit={() => {
            void handleSubmit();
          }}
          onTurnstileTokenChange={setTurnstileToken}
        />
      ) : null}
    </div>
  );
}

function normalizeCatalogItem(value: unknown, index: number): PublicCatalogItem {
  const item = asRecord(value);
  const category = asRecord(item.category);
  const unit = asRecord(item.unit);
  const itemClass = normalizeItemClass(item.itemClass ?? item.item_class);
  const referenceCode = getString(
    item.referenceCode ?? item.reference_code,
    `ITEM-${index + 1}`,
  );
  const categoryName = getString(
    category.name ??
      category.categoryName ??
      category.category_name ??
      item.categoryName ??
      item.category_name,
    'General',
  );
  const unitName = getString(
    unit.name ?? unit.unitName ?? unit.unit_name ?? item.unitName ?? item.unit_name,
    itemClass === 'Producto' ? 'Unidad' : 'Servicio',
  );

  return {
    id: getString(item.id ?? item.itemId ?? item.item_id, referenceCode),
    itemClass,
    referenceCode,
    sku: getNullableString(item.sku),
    name: getString(item.name, referenceCode),
    description: getNullableString(item.description),
    imageUrl: getNullableString(item.imageUrl ?? item.image_url),
    price: getPrice(item.price),
    stock: getNullableNumber(item.stock ?? item.stockQuantity ?? item.stock_quantity),
    unit: {
      id: getString(unit.id ?? unit.unitId ?? unit.unit_id, unitName),
      name: unitName,
    },
    category: {
      id: getString(category.id ?? category.categoryId ?? category.category_id, categoryName),
      name: categoryName,
    },
  };
}

function normalizeItemClass(value: unknown): PublicCatalogItem['itemClass'] {
  return value === 'Servicio' ? 'Servicio' : 'Producto';
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function getString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function getNullableString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getNullableNumber(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(number) ? number : null;
}

function getPrice(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(number) ? number.toFixed(2) : '0.00';
}

function CatalogTile({
  item,
  quantity,
  isPriority = false,
  onAdd,
  onDecrease,
}: {
  item: PublicCatalogItem;
  quantity: number;
  isPriority?: boolean;
  onAdd: () => void;
  onDecrease: () => void;
}) {
  const maxQuantity = item.itemClass === 'Producto' ? item.stock : null;
  const isUnavailable = maxQuantity === 0;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
      <div className="relative aspect-square bg-muted">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              unoptimized
              priority={isPriority}
              className="object-cover"
              sizes="(min-width: 1280px) 14vw, (min-width: 1024px) 18vw, (min-width: 768px) 25vw, 50vw"
            />
          ) : (
            <div className="grid h-full place-items-center bg-muted text-2xl">
              {item.itemClass === 'Producto' ? '📦' : '🛠'}
            </div>
          )}

          <span className="absolute left-1 top-1 inline-flex h-4 items-center gap-0.5 rounded-full bg-secondary px-1.5 py-0 text-[9px] font-medium text-secondary-foreground">
            {item.itemClass === 'Producto' ? (
              <Package className="h-2.5 w-2.5" />
            ) : (
              <Wrench className="h-2.5 w-2.5" />
            )}
            <span className="capitalize">
              {item.itemClass === 'Producto' ? 'producto' : 'servicio'}
            </span>
          </span>

          {isUnavailable ? (
            <div className="absolute inset-0 grid place-items-center bg-background/70">
              <span className="text-[10px] font-semibold text-destructive">
                Agotado
              </span>
            </div>
          ) : null}

      </div>
      <div className="flex h-24 flex-col gap-0.5 p-1.5">
        <p className="line-clamp-2 min-h-[2.2em] text-xs font-medium leading-tight">
          {item.name}
        </p>
        <p className="h-4 truncate text-[10px] text-muted-foreground">
          {item.itemClass === 'Producto'
            ? item.stock == null
              ? 'Stock disponible'
              : `Stock: ${item.stock}`
            : item.category.name}
        </p>
        <div className="mt-auto flex h-6 items-center justify-between gap-1">
          <span className="truncate text-xs font-bold text-primary">
            {currencySymbol} {Number(item.price).toFixed(2)}
          </span>
          {quantity === 0 ? (
            <button
              type="button"
              onClick={onAdd}
              disabled={isUnavailable}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
              aria-label={`Agregar ${item.name}`}
            >
              <Plus className="h-3 w-3" />
            </button>
          ) : (
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={onDecrease}
                className="grid h-5 w-5 place-items-center rounded-full border"
                aria-label={`Reducir ${item.name}`}
              >
                <Minus className="h-2.5 w-2.5" />
              </button>
              <span className="w-3 text-center text-xs font-semibold">{quantity}</span>
              <button
                type="button"
                onClick={onAdd}
                disabled={maxQuantity != null && quantity >= maxQuantity}
                className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
                aria-label={`Aumentar ${item.name}`}
              >
                <Plus className="h-2.5 w-2.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function CartDrawer({
  cartItems,
  customerAddress,
  customerDni,
  customerEmail,
  customerFirstNames,
  customerLastNames,
  customerMode,
  customerPhone,
  deliveryDate,
  deliveryMethod,
  description,
  error,
  isSubmitting,
  step,
  success,
  total,
  turnstileResetKey,
  onAdd,
  onBack,
  onClose,
  onContinueFromForm,
  onCustomerAddressChange,
  onCustomerDniChange,
  onCustomerEmailChange,
  onCustomerFirstNamesChange,
  onCustomerLastNamesChange,
  onCustomerModeChange,
  onCustomerPhoneChange,
  onDecrease,
  onDeliveryDateChange,
  onDeliveryMethodChange,
  onDescriptionChange,
  onRemove,
  onStepChange,
  onSubmit,
  onTurnstileTokenChange,
}: {
  cartItems: Array<{ item: PublicCatalogItem; quantity: number }>;
  customerAddress: string;
  customerDni: string;
  customerEmail: string;
  customerFirstNames: string;
  customerLastNames: string;
  customerMode: 'new' | 'existing';
  customerPhone: string;
  deliveryDate: string;
  deliveryMethod: DeliveryMethod;
  description: string;
  error: string | null;
  isSubmitting: boolean;
  step: Step;
  success: { referenceCode: string; total: string } | null;
  total: number;
  turnstileResetKey: number;
  onAdd: (item: PublicCatalogItem) => void;
  onBack: () => void;
  onClose: () => void;
  onContinueFromForm: () => void;
  onCustomerAddressChange: (value: string) => void;
  onCustomerDniChange: (value: string) => void;
  onCustomerEmailChange: (value: string) => void;
  onCustomerFirstNamesChange: (value: string) => void;
  onCustomerLastNamesChange: (value: string) => void;
  onCustomerModeChange: (value: 'new' | 'existing') => void;
  onCustomerPhoneChange: (value: string) => void;
  onDecrease: (itemId: string) => void;
  onDeliveryDateChange: (value: string) => void;
  onDeliveryMethodChange: (value: DeliveryMethod) => void;
  onDescriptionChange: (value: string) => void;
  onRemove: (itemId: string) => void;
  onStepChange: (value: Step) => void;
  onSubmit: () => void;
  onTurnstileTokenChange: (value: string | null) => void;
}) {
  const canContinue = cartItems.length > 0;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Cerrar carrito"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 flex h-full w-full flex-col bg-background shadow-2xl sm:max-w-md">
        <div className="flex flex-row items-center gap-2 border-b px-4 py-3">
          {step !== 'cart' && !success ? (
            <button
              type="button"
              onClick={onBack}
              className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : null}
          <h2 className="flex-1 text-left text-lg font-semibold">
            {success ? 'Cotización enviada' : getStepTitle(step, customerMode)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"
            aria-label="Cerrar"
          >
            <span aria-hidden>×</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {success ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary text-3xl text-secondary-foreground">
                ✓
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">
                  Solicitud registrada
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Código de referencia: {success.referenceCode}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  Total referencial: {currencySymbol} {success.total}
                </p>
              </div>
            </div>
          ) : null}

          {!success && step === 'cart' ? (
            <CartList
              cartItems={cartItems}
              onAdd={onAdd}
              onDecrease={onDecrease}
              onRemove={onRemove}
            />
          ) : null}

          {!success && step === 'client-type' ? (
            <div className="space-y-3">
              <CustomerModeOption
                checked={customerMode === 'existing'}
                description="Solo necesitamos tu DNI."
                title="Cliente registrado"
                onClick={() => onCustomerModeChange('existing')}
              />
              <CustomerModeOption
                checked={customerMode === 'new'}
                description="Cuéntanos tus datos para crear la solicitud."
                title="Cliente nuevo"
                onClick={() => onCustomerModeChange('new')}
              />
            </div>
          ) : null}

          {!success && step === 'form' ? (
            <QuotationForm
              customerAddress={customerAddress}
              customerDni={customerDni}
              customerEmail={customerEmail}
              customerFirstNames={customerFirstNames}
              customerLastNames={customerLastNames}
              customerMode={customerMode}
              customerPhone={customerPhone}
              deliveryDate={deliveryDate}
              deliveryMethod={deliveryMethod}
              description={description}
              turnstileResetKey={turnstileResetKey}
              onCustomerAddressChange={onCustomerAddressChange}
              onCustomerDniChange={onCustomerDniChange}
              onCustomerEmailChange={onCustomerEmailChange}
              onCustomerFirstNamesChange={onCustomerFirstNamesChange}
              onCustomerLastNamesChange={onCustomerLastNamesChange}
              onCustomerPhoneChange={onCustomerPhoneChange}
              onDeliveryDateChange={onDeliveryDateChange}
              onDeliveryMethodChange={onDeliveryMethodChange}
              onDescriptionChange={onDescriptionChange}
              onTurnstileTokenChange={onTurnstileTokenChange}
            />
          ) : null}

          {!success && step === 'confirm' ? (
            <ConfirmSummary
              cartItems={cartItems}
              customerDni={customerDni}
              customerFirstNames={customerFirstNames}
              customerLastNames={customerLastNames}
              customerMode={customerMode}
              deliveryDate={deliveryDate}
              deliveryMethod={deliveryMethod}
              total={total}
            />
          ) : null}

          {error ? (
            <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        {!success ? (
          <div className="space-y-2 border-t p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{currencySymbol} {total.toFixed(2)}</span>
            </div>
            {step === 'cart' ? (
              <button
                type="button"
                className="w-full rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!canContinue}
                onClick={() => onStepChange('client-type')}
              >
                Confirmar cotización
              </button>
            ) : null}
            {step === 'client-type' ? (
              <button
                type="button"
                className="w-full rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground"
                onClick={() => onStepChange('form')}
              >
                Continuar
              </button>
            ) : null}
            {step === 'form' ? (
              <button
                type="button"
                className="w-full rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground"
                onClick={onContinueFromForm}
              >
                Continuar
              </button>
            ) : null}
            {step === 'confirm' ? (
              <button
                type="button"
                className="w-full rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
                disabled={isSubmitting}
                onClick={onSubmit}
              >
                {isSubmitting ? 'Enviando...' : 'Generar cotización'}
              </button>
            ) : null}
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function getStepTitle(step: Step, customerMode: 'new' | 'existing') {
  if (step === 'cart') {
    return 'Tu cotización';
  }

  if (step === 'client-type') {
    return 'Tipo de cliente';
  }

  if (step === 'form') {
    return customerMode === 'new' ? 'Datos del cliente' : 'Identifícate';
  }

  return 'Confirmar cotización';
}

function CartList({
  cartItems,
  onAdd,
  onDecrease,
  onRemove,
}: {
  cartItems: Array<{ item: PublicCatalogItem; quantity: number }>;
  onAdd: (item: PublicCatalogItem) => void;
  onDecrease: (itemId: string) => void;
  onRemove: (itemId: string) => void;
}) {
  if (cartItems.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Tu carrito está vacío
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {cartItems.map(({ item, quantity }) => (
        <li key={item.id} className="flex gap-3 rounded-lg border p-2">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                unoptimized
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="grid h-full place-items-center bg-muted text-xl">
                {item.itemClass === 'Producto' ? '📦' : '🛠'}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              {currencySymbol} {Number(item.price).toFixed(2)}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onDecrease(item.id)}
                className="grid h-6 w-6 place-items-center rounded border"
                aria-label={`Reducir ${item.name}`}
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-5 text-center text-sm">{quantity}</span>
              <button
                type="button"
                onClick={() => onAdd(item)}
                className="grid h-6 w-6 place-items-center rounded border"
                aria-label={`Aumentar ${item.name}`}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="text-muted-foreground hover:text-destructive"
            aria-label={`Quitar ${item.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function CustomerModeOption({
  checked,
  description,
  title,
  onClick,
}: {
  checked: boolean;
  description: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border p-4 text-left transition ${
        checked ? 'border-primary bg-accent' : 'border-border bg-background'
      }`}
    >
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
          checked ? 'border-primary bg-primary' : 'border-border'
        }`}
      >
        {checked ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
      </span>
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}

function QuotationForm({
  customerAddress,
  customerDni,
  customerEmail,
  customerFirstNames,
  customerLastNames,
  customerMode,
  customerPhone,
  deliveryDate,
  deliveryMethod,
  description,
  turnstileResetKey,
  onCustomerAddressChange,
  onCustomerDniChange,
  onCustomerEmailChange,
  onCustomerFirstNamesChange,
  onCustomerLastNamesChange,
  onCustomerPhoneChange,
  onDeliveryDateChange,
  onDeliveryMethodChange,
  onDescriptionChange,
  onTurnstileTokenChange,
}: {
  customerAddress: string;
  customerDni: string;
  customerEmail: string;
  customerFirstNames: string;
  customerLastNames: string;
  customerMode: 'new' | 'existing';
  customerPhone: string;
  deliveryDate: string;
  deliveryMethod: DeliveryMethod;
  description: string;
  turnstileResetKey: number;
  onCustomerAddressChange: (value: string) => void;
  onCustomerDniChange: (value: string) => void;
  onCustomerEmailChange: (value: string) => void;
  onCustomerFirstNamesChange: (value: string) => void;
  onCustomerLastNamesChange: (value: string) => void;
  onCustomerPhoneChange: (value: string) => void;
  onDeliveryDateChange: (value: string) => void;
  onDeliveryMethodChange: (value: DeliveryMethod) => void;
  onDescriptionChange: (value: string) => void;
  onTurnstileTokenChange: (value: string | null) => void;
}) {
  return (
    <div className="space-y-3">
      <FieldLabel label="DNI">
        <input
          value={customerDni}
            onChange={(event) =>
              onCustomerDniChange(
                event.target.value.replace(/\D/g, '').slice(0, documentNumberLength),
              )
            }
            className={fieldClassName}
            placeholder="Solo numeros"
            inputMode="numeric"
        />
      </FieldLabel>

      {customerMode === 'new' ? (
        <>
          <FieldLabel label="Nombres">
            <input
              value={customerFirstNames}
              onChange={(event) => onCustomerFirstNamesChange(event.target.value)}
              className={fieldClassName}
              maxLength={80}
            />
          </FieldLabel>
          <FieldLabel label="Apellidos">
            <input
              value={customerLastNames}
              onChange={(event) => onCustomerLastNamesChange(event.target.value)}
              className={fieldClassName}
              maxLength={80}
            />
          </FieldLabel>
          <FieldLabel label="Teléfono">
            <input
              value={customerPhone}
              onChange={(event) => onCustomerPhoneChange(event.target.value)}
              className={fieldClassName}
              inputMode="tel"
              maxLength={20}
            />
          </FieldLabel>
          <FieldLabel label="Email opcional">
            <input
              type="email"
              value={customerEmail}
              onChange={(event) => onCustomerEmailChange(event.target.value)}
              className={fieldClassName}
              maxLength={120}
            />
          </FieldLabel>
          <FieldLabel label="Dirección opcional">
            <textarea
              value={customerAddress}
              onChange={(event) => onCustomerAddressChange(event.target.value)}
              className={`${fieldClassName} min-h-20 resize-none`}
            />
          </FieldLabel>
        </>
      ) : (
        <div className="rounded-lg border p-3 text-xs leading-5 text-muted-foreground">
          Si el DNI ya está registrado, el negocio asociará la cotización con
          ese cliente.
        </div>
      )}

      <FieldLabel label="Fecha estimada">
        <input
          type="date"
          value={deliveryDate}
          onChange={(event) => onDeliveryDateChange(event.target.value)}
          className={fieldClassName}
        />
      </FieldLabel>

      <FieldLabel label="Método de entrega">
        <select
          value={deliveryMethod}
          onChange={(event) =>
            onDeliveryMethodChange(event.target.value as DeliveryMethod)
          }
          className={fieldClassName}
        >
          <option value="Entrega a domicilio">Entrega a domicilio</option>
          <option value="Recojo en tienda">Recojo en tienda</option>
        </select>
      </FieldLabel>

      <FieldLabel label="Observaciones opcionales">
        <textarea
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          className={`${fieldClassName} min-h-24 resize-none`}
          placeholder="Detalles útiles para preparar tu propuesta."
        />
      </FieldLabel>

      <TurnstileField
        siteKey={turnstileSiteKey}
        resetKey={turnstileResetKey}
        onTokenChange={onTurnstileTokenChange}
      />
    </div>
  );
}

const fieldClassName =
  'mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-ring';

function FieldLabel({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      {children}
    </label>
  );
}

function ConfirmSummary({
  cartItems,
  customerDni,
  customerFirstNames,
  customerLastNames,
  customerMode,
  deliveryDate,
  deliveryMethod,
  total,
}: {
  cartItems: Array<{ item: PublicCatalogItem; quantity: number }>;
  customerDni: string;
  customerFirstNames: string;
  customerLastNames: string;
  customerMode: 'new' | 'existing';
  deliveryDate: string;
  deliveryMethod: DeliveryMethod;
  total: number;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1 rounded-lg border p-3 text-sm">
        <p className="font-medium">Resumen</p>
        <div className="space-y-2">
          {cartItems.map(({ item, quantity }) => (
            <div key={item.id} className="flex justify-between gap-4 text-xs text-muted-foreground">
              <span>
                {item.name} x{quantity}
              </span>
              <span>
                {currencySymbol} {(Number(item.price) * quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
          <span>Total</span>
          <span>{currencySymbol} {total.toFixed(2)}</span>
        </div>
      </div>

      <div className="rounded-lg border p-3 text-sm">
        <p className="font-medium">Cliente</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {customerMode === 'new'
            ? `${customerFirstNames} ${customerLastNames}`.trim()
            : 'Cliente registrado'}{' '}
          · DNI {customerDni}
        </p>
      </div>

      <div className="rounded-lg border p-3 text-sm">
        <p className="font-medium">Entrega</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {deliveryMethod} · {deliveryDate}
        </p>
      </div>
    </div>
  );
}

export enum PlanStatus {
  Enabled = 'Activado',
  Disabled = 'Desactivado',
}

export enum PlanPeriod {
  Monthly = 'Mensual',
  Yearly = 'Anual',
}

export enum ModuleType {
  Basic = 'Básico',
  Premium = 'Premium',
}

export enum BusinessModuleStatus {
  Enabled = 'Activado',
  Blocked = 'Bloqueado',
}

export enum ItemClass {
  Product = 'Producto',
  Service = 'Servicio',
}

export enum SubscriptionStatus {
  Active = 'Activo',
  Inactive = 'Inactivo',
}

export enum OrderStatus {
  Pending = 'Pendiente',
  Reserved = 'Reserva',
  Active = 'Activo',
  Delivered = 'Entregado',
  OnTheWay = 'En camino',
}

export enum PaymentStatus {
  Paid = 'Cancelado',
  Unpaid = 'No cancelado',
  Advance = 'Adelanto',
}

export enum DeliveryMethod {
  HomeDelivery = 'Entrega a domicilio',
  Pickup = 'Recojo en tienda',
}

export enum QuotationOrigin {
  Internal = 'Interno',
  PublicCatalog = 'Catálogo público',
}

export enum AuditAction {
  Create = 'Crear',
  Update = 'Actualizar',
  Delete = 'Eliminar',
  Login = 'Inicio de sesión',
  Logout = 'Cierre de sesión',
}

export enum ColorPaletteId {
  Violet = 'violet',
  Ocean = 'ocean',
  Forest = 'forest',
  Ember = 'ember',
  Rose = 'rose',
  Slate = 'slate',
  Graphite = 'graphite',
  Sand = 'sand',
}

export enum UserStatus {
  Inactive = 'Inactive',
  Active = 'Active',
  Blocked = 'Blocked',
}

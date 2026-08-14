export const endpoints = {
  auth: {
    login: "/auth/login"
  },
  users: {
    create: "users/create",
    update: "users/update",
    delete: "users/delete",
    getByStatus: "users/getByStatus",
  },
  products: {
    base: "/products",
    byId: (id) => `/products/${id}`,
  },
  categories: {
    base: "/categories",
  },
  deals: {
    base: "/deals",
  },
  sections: {
    base: "/sections",
  },
}
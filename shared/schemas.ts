import { z } from 'zod'

export const shoeModelSchema = z.object({
  reference: z.string().min(1, 'La référence est requise'),
  name: z.string().min(1, 'Le nom est requis'),
  category: z.enum(['Classique', 'Sport', 'Professionnelle', 'Sécurité', 'Enfant', 'Personnalisée']),
  gender: z.enum(['Homme', 'Femme', 'Enfant', 'Unisexe']),
  season: z.string().optional(),
  collection: z.string().optional(),
  description: z.string().optional(),
  photo_url: z.string().optional(),
  status: z.enum(['Actif', 'Inactif']).default('Actif')
})

export const rawMaterialSchema = z.object({
  code: z.string().min(1, 'Le code est requis'),
  designation: z.string().min(1, 'La désignation est requise'),
  category: z.string().min(1, 'La catégorie est requise'),
  unit: z.string().min(1, "L'unité est requise"),
  unit_price: z.number().nonnegative(),
  stock_quantity: z.number().default(0),
  min_threshold: z.number().nonnegative().default(10),
  supplier_id: z.number().optional(),
  location: z.string().optional()
})

export const productionOrderSchema = z.object({
  model_id: z.number().positive(),
  color: z.string().min(1),
  total_quantity: z.number().positive(),
  size_breakdown: z.record(z.string(), z.number()),
  start_date: z.string(),
  due_date: z.string(),
  manager: z.string().default('Chef Atelier'),
  priority: z.enum(['Basse', 'Normale', 'Haute', 'Urgente']).default('Normale'),
  observations: z.string().optional()
})

export const customerOrderSchema = z.object({
  customer_id: z.number().positive(),
  order_date: z.string(),
  delivery_date: z.string().optional(),
  items: z.array(
    z.object({
      model_id: z.number().positive(),
      color: z.string().min(1),
      size: z.number().positive(),
      quantity: z.number().positive(),
      unit_price: z.number().positive()
    })
  ).min(1, 'Au moins un article est requis'),
  discount: z.number().default(0),
  advance_paid: z.number().default(0),
  notes: z.string().optional()
})

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          is_system: boolean;
          name: string;
          type: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          is_system?: boolean;
          name: string;
          type: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          is_system?: boolean;
          name?: string;
          type?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          entity: string;
          entity_id: string | null;
          id: string;
          payload: Json | null;
          user_id: string;
        };
        Insert: {
          action: string;
          created_at?: string;
          entity: string;
          entity_id?: string | null;
          id?: string;
          payload?: Json | null;
          user_id: string;
        };
        Update: {
          action?: string;
          created_at?: string;
          entity?: string;
          entity_id?: string | null;
          id?: string;
          payload?: Json | null;
          user_id?: string;
        };
        Relationships: [];
      };
      campaign_products: {
        Row: {
          campaign_id: string;
          id: string;
          min_quantity: number;
          product_id: string;
        };
        Insert: {
          campaign_id: string;
          id?: string;
          min_quantity?: number;
          product_id: string;
        };
        Update: {
          campaign_id?: string;
          id?: string;
          min_quantity?: number;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaign_products_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaign_products_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      campaigns: {
        Row: {
          created_at: string;
          created_by: string | null;
          discount_type: string;
          discount_value: number;
          end_date: string;
          id: string;
          is_active: boolean;
          name: string;
          start_date: string;
          trigger_type: string;
          trigger_value: number | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          discount_type: string;
          discount_value: number;
          end_date: string;
          id?: string;
          is_active?: boolean;
          name: string;
          start_date: string;
          trigger_type?: string;
          trigger_value?: number | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          discount_type?: string;
          discount_value?: number;
          end_date?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          start_date?: string;
          trigger_type?: string;
          trigger_value?: number | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      inventory_adjustment_items: {
        Row: {
          adjustment_id: string;
          batch_id: string | null;
          cost_price: number;
          id: string;
          product_id: string;
          quantity_change: number;
          reason: string | null;
        };
        Insert: {
          adjustment_id: string;
          batch_id?: string | null;
          cost_price: number;
          id?: string;
          product_id: string;
          quantity_change: number;
          reason?: string | null;
        };
        Update: {
          adjustment_id?: string;
          batch_id?: string | null;
          cost_price?: number;
          id?: string;
          product_id?: string;
          quantity_change?: number;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_adjustment_items_adjustment_id_fkey";
            columns: ["adjustment_id"];
            isOneToOne: false;
            referencedRelation: "inventory_adjustments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_adjustment_items_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "inventory_batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_adjustment_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_adjustments: {
        Row: {
          adjustment_number: string;
          created_at: string;
          created_by: string | null;
          id: string;
          notes: string | null;
          reason: string;
        };
        Insert: {
          adjustment_number: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          reason: string;
        };
        Update: {
          adjustment_number?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          reason?: string;
        };
        Relationships: [];
      };
      inventory_batches: {
        Row: {
          cost_price: number;
          created_at: string;
          expiry_date: string | null;
          id: string;
          product_id: string;
          quantity_in: number;
          quantity_remaining: number;
          reference_id: string | null;
          reference_type: string | null;
        };
        Insert: {
          cost_price: number;
          created_at?: string;
          expiry_date?: string | null;
          id?: string;
          product_id: string;
          quantity_in: number;
          quantity_remaining: number;
          reference_id?: string | null;
          reference_type?: string | null;
        };
        Update: {
          cost_price?: number;
          created_at?: string;
          expiry_date?: string | null;
          id?: string;
          product_id?: string;
          quantity_in?: number;
          quantity_remaining?: number;
          reference_id?: string | null;
          reference_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_batches_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_movements: {
        Row: {
          batch_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          product_id: string;
          quantity: number;
          reference_id: string;
          reference_type: string;
          type: string;
        };
        Insert: {
          batch_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          product_id: string;
          quantity: number;
          reference_id: string;
          reference_type: string;
          type: string;
        };
        Update: {
          batch_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          product_id?: string;
          quantity?: number;
          reference_id?: string;
          reference_type?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_movements_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "inventory_batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      journal_entries: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          reference_id: string;
          reference_type: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          reference_id: string;
          reference_type: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          reference_id?: string;
          reference_type?: string;
        };
        Relationships: [];
      };
      journal_lines: {
        Row: {
          account_id: string;
          credit: number;
          debit: number;
          id: string;
          journal_entry_id: string;
        };
        Insert: {
          account_id: string;
          credit?: number;
          debit?: number;
          id?: string;
          journal_entry_id: string;
        };
        Update: {
          account_id?: string;
          credit?: number;
          debit?: number;
          id?: string;
          journal_entry_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journal_lines_journal_entry_id_fkey";
            columns: ["journal_entry_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      product_prices: {
        Row: {
          bulk_min_qty: number | null;
          bulk_price: number | null;
          created_by: string | null;
          effective_from: string;
          id: string;
          price: number;
          product_id: string;
        };
        Insert: {
          bulk_min_qty?: number | null;
          bulk_price?: number | null;
          created_by?: string | null;
          effective_from?: string;
          id?: string;
          price: number;
          product_id: string;
        };
        Update: {
          bulk_min_qty?: number | null;
          bulk_price?: number | null;
          created_by?: string | null;
          effective_from?: string;
          id?: string;
          price?: number;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_prices_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_units: {
        Row: {
          conversion_to_base: number;
          created_at: string;
          id: string;
          is_base: boolean;
          product_id: string;
          unit_name: string;
        };
        Insert: {
          conversion_to_base: number;
          created_at?: string;
          id?: string;
          is_base?: boolean;
          product_id: string;
          unit_name: string;
        };
        Update: {
          conversion_to_base?: number;
          created_at?: string;
          id?: string;
          is_base?: boolean;
          product_id?: string;
          unit_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_units_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          bulk_min_qty: number | null;
          bulk_price: number | null;
          category: string | null;
          created_at: string;
          id: string;
          image_url: string | null;
          is_active: boolean;
          latest_cost_price: number | null;
          name: string;
          selling_price: number;
          sku: string;
          unit: string;
          updated_at: string;
        };
        Insert: {
          bulk_min_qty?: number | null;
          bulk_price?: number | null;
          category?: string | null;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          latest_cost_price?: number | null;
          name: string;
          selling_price: number;
          sku: string;
          unit?: string;
          updated_at?: string;
        };
        Update: {
          bulk_min_qty?: number | null;
          bulk_price?: number | null;
          category?: string | null;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          latest_cost_price?: number | null;
          name?: string;
          selling_price?: number;
          sku?: string;
          unit?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          email: string;
          full_name: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          email?: string;
          full_name?: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      purchase_order_items: {
        Row: {
          cost_price: number;
          expiry_date: string | null;
          id: string;
          product_id: string;
          purchase_order_id: string;
          quantity: number;
          subtotal: number;
        };
        Insert: {
          cost_price: number;
          expiry_date?: string | null;
          id?: string;
          product_id: string;
          purchase_order_id: string;
          quantity: number;
          subtotal: number;
        };
        Update: {
          cost_price?: number;
          expiry_date?: string | null;
          id?: string;
          product_id?: string;
          purchase_order_id?: string;
          quantity?: number;
          subtotal?: number;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey";
            columns: ["purchase_order_id"];
            isOneToOne: false;
            referencedRelation: "purchase_orders";
            referencedColumns: ["id"];
          },
        ];
      };
      purchase_orders: {
        Row: {
          created_at: string;
          created_by: string | null;
          due_date: string | null;
          id: string;
          notes: string | null;
          payment_method: string;
          po_number: string;
          received_at: string | null;
          status: string;
          supplier_id: string | null;
          total_amount: number;
          void_reason: string | null;
          voided_at: string | null;
          voided_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          due_date?: string | null;
          id?: string;
          notes?: string | null;
          payment_method: string;
          po_number: string;
          received_at?: string | null;
          status?: string;
          supplier_id?: string | null;
          total_amount?: number;
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          due_date?: string | null;
          id?: string;
          notes?: string | null;
          payment_method?: string;
          po_number?: string;
          received_at?: string | null;
          status?: string;
          supplier_id?: string | null;
          total_amount?: number;
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      purchase_return_items: {
        Row: {
          id: string;
          product_id: string;
          quantity: number;
          refund_amount: number;
          return_id: string;
          unit_cost: number;
        };
        Insert: {
          id?: string;
          product_id: string;
          quantity: number;
          refund_amount: number;
          return_id: string;
          unit_cost: number;
        };
        Update: {
          id?: string;
          product_id?: string;
          quantity?: number;
          refund_amount?: number;
          return_id?: string;
          unit_cost?: number;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_return_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_return_items_return_id_fkey";
            columns: ["return_id"];
            isOneToOne: false;
            referencedRelation: "purchase_returns";
            referencedColumns: ["id"];
          },
        ];
      };
      purchase_returns: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          notes: string | null;
          purchase_order_id: string;
          refund_method: string;
          return_number: string;
          total_refund: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          purchase_order_id: string;
          refund_method: string;
          return_number: string;
          total_refund: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          purchase_order_id?: string;
          refund_method?: string;
          return_number?: string;
          total_refund?: number;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_returns_purchase_order_id_fkey";
            columns: ["purchase_order_id"];
            isOneToOne: false;
            referencedRelation: "purchase_orders";
            referencedColumns: ["id"];
          },
        ];
      };
      push_subscriptions: {
        Row: {
          auth: string;
          created_at: string;
          endpoint: string;
          id: string;
          last_seen_at: string;
          p256dh: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          auth: string;
          created_at?: string;
          endpoint: string;
          id?: string;
          last_seen_at?: string;
          p256dh: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          auth?: string;
          created_at?: string;
          endpoint?: string;
          id?: string;
          last_seen_at?: string;
          p256dh?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      resellers: {
        Row: {
          address: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          phone: string | null;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          phone?: string | null;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          phone?: string | null;
        };
        Relationships: [];
      };
      sale_credit_payments: {
        Row: {
          amount: number;
          created_at: string;
          created_by: string | null;
          id: string;
          notes: string | null;
          payment_method: string;
          sale_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          payment_method: string;
          sale_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          payment_method?: string;
          sale_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sale_credit_payments_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      sale_items: {
        Row: {
          id: string;
          price: number;
          product_id: string;
          quantity: number;
          sale_id: string;
          subtotal: number;
        };
        Insert: {
          id?: string;
          price: number;
          product_id: string;
          quantity: number;
          sale_id: string;
          subtotal: number;
        };
        Update: {
          id?: string;
          price?: number;
          product_id?: string;
          quantity?: number;
          sale_id?: string;
          subtotal?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      sale_payments: {
        Row: {
          amount: number;
          id: string;
          payment_method: string;
          sale_id: string;
        };
        Insert: {
          amount: number;
          id?: string;
          payment_method: string;
          sale_id: string;
        };
        Update: {
          amount?: number;
          id?: string;
          payment_method?: string;
          sale_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sale_payments_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      sale_return_items: {
        Row: {
          id: string;
          product_id: string;
          quantity: number;
          refund_amount: number;
          return_id: string;
          unit_price: number;
        };
        Insert: {
          id?: string;
          product_id: string;
          quantity: number;
          refund_amount: number;
          return_id: string;
          unit_price: number;
        };
        Update: {
          id?: string;
          product_id?: string;
          quantity?: number;
          refund_amount?: number;
          return_id?: string;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sale_return_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_return_items_return_id_fkey";
            columns: ["return_id"];
            isOneToOne: false;
            referencedRelation: "sale_returns";
            referencedColumns: ["id"];
          },
        ];
      };
      sale_returns: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          notes: string | null;
          refund_method: string;
          return_number: string;
          sale_id: string;
          total_cogs_returned: number;
          total_refund: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          refund_method: string;
          return_number: string;
          sale_id: string;
          total_cogs_returned?: number;
          total_refund: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          refund_method?: string;
          return_number?: string;
          sale_id?: string;
          total_cogs_returned?: number;
          total_refund?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sale_returns_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      sales: {
        Row: {
          campaign_savings: number;
          cart_campaign_discount: number;
          created_at: string;
          created_by: string | null;
          delivery_fee: number;
          discount_amount: number;
          due_date: string | null;
          id: string;
          idempotency_key: string | null;
          invoice_number: string;
          payment_method: string;
          reseller_id: string | null;
          status: string;
          total_amount: number;
          total_cogs: number;
          void_reason: string | null;
          voided_at: string | null;
          voided_by: string | null;
        };
        Insert: {
          campaign_savings?: number;
          cart_campaign_discount?: number;
          created_at?: string;
          created_by?: string | null;
          delivery_fee?: number;
          discount_amount?: number;
          due_date?: string | null;
          id?: string;
          idempotency_key?: string | null;
          invoice_number: string;
          payment_method: string;
          reseller_id?: string | null;
          status?: string;
          total_amount?: number;
          total_cogs?: number;
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Update: {
          campaign_savings?: number;
          cart_campaign_discount?: number;
          created_at?: string;
          created_by?: string | null;
          delivery_fee?: number;
          discount_amount?: number;
          due_date?: string | null;
          id?: string;
          idempotency_key?: string | null;
          invoice_number?: string;
          payment_method?: string;
          reseller_id?: string | null;
          status?: string;
          total_amount?: number;
          total_cogs?: number;
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sales_reseller_id_fkey";
            columns: ["reseller_id"];
            isOneToOne: false;
            referencedRelation: "resellers";
            referencedColumns: ["id"];
          },
        ];
      };
      stock_reservations: {
        Row: {
          created_at: string;
          created_by: string | null;
          expires_at: string;
          id: string;
          product_id: string;
          quantity: number;
          reference: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          expires_at: string;
          id?: string;
          product_id: string;
          quantity: number;
          reference: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          expires_at?: string;
          id?: string;
          product_id?: string;
          quantity?: number;
          reference?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stock_reservations_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      store_settings: {
        Row: {
          id: string;
          store_icon_url: string | null;
          store_name: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_icon_url?: string | null;
          store_name?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_icon_url?: string | null;
          store_name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      supplier_payments: {
        Row: {
          amount: number;
          created_at: string;
          created_by: string | null;
          id: string;
          notes: string | null;
          payment_method: string;
          purchase_order_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          payment_method: string;
          purchase_order_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          payment_method?: string;
          purchase_order_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "supplier_payments_purchase_order_id_fkey";
            columns: ["purchase_order_id"];
            isOneToOne: false;
            referencedRelation: "purchase_orders";
            referencedColumns: ["id"];
          },
        ];
      };
      suppliers: {
        Row: {
          address: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          phone: string | null;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          phone?: string | null;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          phone?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          locale: string | null;
          role: string;
          theme: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          locale?: string | null;
          role: string;
          theme?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          locale?: string | null;
          role?: string;
          theme?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      collect_sale_payment: { Args: { p_payload: Json }; Returns: Json };
      create_inventory_adjustment: {
        Args: { adj_payload: Json };
        Returns: Json;
      };
      create_purchase_return: { Args: { p_payload: Json }; Returns: Json };
      create_sale_return: { Args: { p_payload: Json }; Returns: Json };
      create_sale_transaction: { Args: { sale_payload: Json }; Returns: Json };
      get_profit_loss: {
        Args: { p_end_date: string; p_start_date: string };
        Returns: {
          amount: number;
          code: string;
          name: string;
          type: string;
        }[];
      };
      get_sales_summary: {
        Args: {
          p_end_date?: string;
          p_payment_type?: string;
          p_start_date?: string;
          p_timezone?: string;
        };
        Returns: {
          gross_profit: number;
          sale_date: string;
          total_cogs: number;
          total_delivery_fee: number;
          total_discount: number;
          total_revenue: number;
          total_transactions: number;
        }[];
      };
      get_stock_report: {
        Args: never;
        Returns: {
          category: string;
          id: string;
          name: string;
          sku: string;
          stock_on_hand: number;
          stock_value: number;
        }[];
      };
      is_owner: { Args: never; Returns: boolean };
      pay_supplier: { Args: { p_payload: Json }; Returns: Json };
      receive_purchase_order: { Args: { p_po_id: string }; Returns: Json };
      release_stock_reservations: {
        Args: { p_reference: string };
        Returns: Json;
      };
      reserve_stock: { Args: { reservation_payload: Json }; Returns: Json };
      void_purchase_order: {
        Args: { p_po_id: string; p_reason: string };
        Returns: Json;
      };
      void_sale: {
        Args: { p_reason: string; p_sale_id: string };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

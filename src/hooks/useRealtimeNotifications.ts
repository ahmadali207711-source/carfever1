'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function useRealtimeNotifications() {
  const [newListingsCount, setNewListingsCount] = useState(0)
  const [newInquiriesCount, setNewInquiriesCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('admin-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cars',
          filter: 'status=eq.pending'
        },
        (payload: any) => {
          setNewListingsCount((prev) => prev + 1)
          toast('🚗 New Car Listing Submitted!', {
            description: `${payload.new.title} is pending approval`,
            action: {
              label: 'View',
              onClick: () => window.location.href = '/admin/cars'
            }
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cars'
        },
        (payload: any) => {
          const oldStatus = payload.old.status
          const newStatus = payload.new.status
          
          if (oldStatus !== newStatus) {
            if (newStatus === 'approved') {
              toast('✅ Car Approved!', {
                description: `${payload.new.title} has been approved and is now live`
              })
            } else if (newStatus === 'rejected') {
              toast('❌ Car Rejected', {
                description: `${payload.new.title} has been rejected`
              })
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inquiries'
        },
        (payload: any) => {
          setNewInquiriesCount((prev) => prev + 1)
          toast('📩 New Inquiry Received!', {
            description: `From: ${payload.new.name} - ${payload.new.subject || 'No subject'}`,
            action: {
              label: 'View',
              onClick: () => window.location.href = '/admin/inquiries'
            }
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inspections'
        },
        (payload: any) => {
          toast('🔍 New Inspection Booked!', {
            description: `${payload.new.customer_name} booked ${payload.new.plan} plan for ${payload.new.make} ${payload.new.model}`,
            action: {
              label: 'View',
              onClick: () => window.location.href = '/admin/inspections'
            }
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'inspections'
        },
        (payload: any) => {
          const oldStatus = payload.old.status
          const newStatus = payload.new.status
          
          if (oldStatus !== newStatus) {
            toast('📋 Inspection Status Updated', {
              description: `Booking #${payload.new.id.slice(0, 8)} changed from ${oldStatus} to ${newStatus}`
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return {
    newListingsCount,
    newInquiriesCount,
    clearCounts: () => {
      setNewListingsCount(0)
      setNewInquiriesCount(0)
    }
  }
}

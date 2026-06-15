'use client';

import { useState } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { useRouter } from 'next/navigation';
import { CreditCard, Loader2 } from 'lucide-react';

interface CheckoutButtonProps {
  email: string;
  userId: string;
  planCode: string;
  amount: number; // in lowest denomination, e.g., kobo/pesewas
}

export default function CheckoutButton({
  email,
  userId,
  planCode,
  amount,
}: CheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const config = {
    reference: new Date().getTime().toString(),
    email,
    amount,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    plan: planCode,
    metadata: {
      custom_fields: [
        {
          display_name: 'User ID',
          variable_name: 'user_id',
          value: userId,
        },
      ],
    },
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = (reference: any) => {
    setLoading(true);
    // In a real app, you might poll your backend or rely on webhooks
    // We refresh the router to aggressively invalidate cache and re-fetch the subscription tier
    setTimeout(() => {
      router.refresh();
      setLoading(false);
    }, 2000); // Wait a moment for webhook to process
  };

  const onClose = () => {
    setLoading(false);
  };

  const handleCheckout = () => {
    setLoading(true);
    initializePayment({ onSuccess, onClose } as any);
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      style={{
        width: '100%',
        padding: '0.875rem',
        backgroundColor: '#10b981',
        color: '#000',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        transition: 'background-color 0.2s',
        opacity: loading ? 0.7 : 1,
      }}
      onMouseOver={(e) => {
        if (!loading) e.currentTarget.style.backgroundColor = '#0ea5e9';
      }}
      onMouseOut={(e) => {
        if (!loading) e.currentTarget.style.backgroundColor = '#10b981';
      }}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={20} />
          Processing Upgrade...
        </>
      ) : (
        <>
          <CreditCard size={18} />
          Upgrade to Alpha
        </>
      )}
    </button>
  );
}

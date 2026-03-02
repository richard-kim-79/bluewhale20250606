"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

interface Props {
  newsletterId: string;
  isPaid: boolean;
  price: number;
}

export default function SubscribeButton({ newsletterId, isPaid, price }: Props) {
  const router = useRouter();

  const handleSubscribe = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    if (isPaid) {
      // 유료 구독은 결제 플로우로 이동 (3단계에서 토스페이먼츠 연동)
      alert(`유료 구독 결제 (월 ${price.toLocaleString()}원) 기능은 결제 연동 후 활성화됩니다.`);
      return;
    }

    const { error } = await supabase.from("subscriptions").insert({
      subscriber_id: user.id,
      newsletter_id: newsletterId,
      is_paid: false,
      status: "active",
    });

    if (error) {
      if (error.code === "23505") {
        alert("이미 구독 중입니다.");
      } else {
        alert("구독 실패: " + error.message);
      }
      return;
    }

    router.refresh();
  };

  return (
    <Button onClick={handleSubscribe}>
      {isPaid ? `월 ${price.toLocaleString()}원 구독하기` : "무료 구독하기"}
    </Button>
  );
}

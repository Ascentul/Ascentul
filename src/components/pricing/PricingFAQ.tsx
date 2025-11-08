import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqItems = [
  {
    question: 'Can I switch between plans?',
    answer:
      'Yes! You can upgrade or downgrade your plan at any time. When you upgrade, you\'ll be charged a prorated amount for the remainder of your billing cycle. When you downgrade, the change will take effect at the start of your next billing period.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards (Visa, MasterCard, American Express, Discover) and process payments securely through Stripe. Your payment information is encrypted and never stored on our servers.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'We offer a free plan with limited features so you can explore the platform before committing to a paid subscription. You can upgrade to a premium plan at any time to unlock all features.',
  },
  {
    question: 'What happens if I cancel?',
    answer:
      'You can cancel your subscription at any time. You\'ll continue to have access to premium features until the end of your current billing period. After that, your account will automatically switch to the free plan.',
  },
  {
    question: 'Do you offer refunds?',
    answer:
      'Yes, we offer a 30-day money-back guarantee. If you\'re not satisfied with your premium subscription within the first 30 days, contact our support team for a full refund.',
  },
  {
    question: 'Can I use Ascentful for my team or university?',
    answer:
      'Yes! We offer university and enterprise plans with volume discounts and additional features for teams. Contact us to learn more about institutional licensing options.',
  },
]

export function PricingFAQ() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
          Frequently Asked Questions
        </h2>
        <p className="text-base text-zinc-600">
          Everything you need to know about our pricing and plans
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {faqItems.map((item) => (
          <AccordionItem key={item.question} value={item.question}>
            <AccordionTrigger className="text-left text-zinc-900 hover:text-zinc-700">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-zinc-600">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

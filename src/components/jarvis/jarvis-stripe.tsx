'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Shield, Check, X, Zap, Star, Crown, Loader2, Settings, Eye, EyeOff, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useJarvisStore, type Subscription } from '@/lib/jarvis-store';

const PLAN_CONFIG: Record<string, { label: string; color: string; price: string; features: string[]; icon: React.ElementType }> = {
  free: {
    label: 'Gratuito',
    color: 'bg-gray-400/10 text-gray-400 border-gray-400/20',
    price: 'R$ 0',
    features: ['5 conversas/dia', 'Busca web limitada', 'Armazenamento 100MB', 'Sem visão computacional'],
    icon: Zap,
  },
  pro: {
    label: 'Pro',
    color: 'bg-jarvis-cyan/10 text-jarvis-cyan border-jarvis-cyan/20',
    price: 'R$ 49/mês',
    features: ['Conversas ilimitadas', 'Busca web ilimitada', 'Armazenamento 10GB', 'Visão computacional', 'Email integrado', 'Redes sociais'],
    icon: Star,
  },
  enterprise: {
    label: 'Enterprise',
    color: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
    price: 'R$ 199/mês',
    features: ['Tudo do Pro', 'Armazenamento ilimitado', 'API personalizada', 'Suporte prioritário', 'Múltiplas contas', 'Campanhas avançadas', 'SLA garantido'],
    icon: Crown,
  },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function JarvisStripe() {
  const { stripeConfig, subscription, subscriptions, isLoadingStripe, loadStripeConfig, configureStripe, sendMessage } = useJarvisStore();

  const [showConfig, setShowConfig] = useState(false);
  const [configData, setConfigData] = useState({ publicKey: '', secretKey: '', mode: 'test' });
  const [showSecret, setShowSecret] = useState(false);
  const [configuring, setConfiguring] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);

  useEffect(() => {
    loadStripeConfig();
  }, [loadStripeConfig]);

  const handleConfigure = useCallback(async () => {
    if (!configData.publicKey.trim() || !configData.secretKey.trim()) return;
    setConfiguring(true);
    await configureStripe(configData.publicKey, configData.secretKey, configData.mode);
    setConfigData({ publicKey: '', secretKey: '', mode: 'test' });
    setShowConfig(false);
    setConfiguring(false);
  }, [configData, configureStripe]);

  const handleCheckout = useCallback(async (plan: string) => {
    setCheckoutPlan(plan);
    // Simulated checkout
    const store = useJarvisStore.getState();
    await store.addNotification({
      type: 'success',
      title: `Checkout ${plan}`,
      message: `Sessão de checkout para o plano ${PLAN_CONFIG[plan]?.label || plan} criada com sucesso.`,
      read: false,
    });
    setCheckoutPlan(null);
  }, []);

  const handleAskJarvis = useCallback(() => {
    const currentPlan = subscription?.plan || 'free';
    sendMessage(`Qual é o status da minha assinatura? Estou no plano ${PLAN_CONFIG[currentPlan]?.label || currentPlan}. Vale a pena fazer upgrade?`);
  }, [subscription, sendMessage]);

  const currentPlan = subscription?.plan || 'free';
  const currentPlanConfig = PLAN_CONFIG[currentPlan];

  return (
    <div className="jarvis-panel p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-jarvis-cyan/10">
          <CreditCard className="h-5 w-5 text-jarvis-cyan" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-jarvis-cyan jarvis-glow-text">Pagamentos</h2>
          <p className="text-xs text-muted-foreground">Stripe e assinaturas</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleAskJarvis} className="text-jarvis-cyan/60 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan gap-1.5">
          <Zap className="h-3.5 w-3.5" />
          <span className="text-[10px] hidden sm:inline">Consultar</span>
        </Button>
      </div>

      <ScrollArea className="jarvis-scrollbar flex-1">
        {isLoadingStripe ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 text-jarvis-cyan animate-spin" />
            <span className="ml-2 text-xs text-muted-foreground">Carregando...</span>
          </div>
        ) : (
          <div className="space-y-4 pr-2">
            {/* Current Subscription */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="jarvis-panel p-4"
            >
              <h3 className="text-[10px] tracking-[0.2em] text-muted-foreground/50 uppercase mb-3">
                Assinatura Atual
              </h3>
              {subscription ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const PlanIcon = currentPlanConfig?.icon || Zap;
                      return <PlanIcon className="h-5 w-5 text-jarvis-cyan" />;
                    })()}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground/90">{currentPlanConfig?.label || currentPlan}</p>
                        <Badge variant="outline" className={currentPlanConfig?.color || ''}>
                          {subscription.status === 'active' ? 'Ativo' : subscription.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground/50">{currentPlanConfig?.price || ''}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-jarvis-dark/50 rounded-md p-2">
                      <p className="text-[9px] text-muted-foreground/40">Início do Período</p>
                      <p className="text-xs text-foreground/70">{formatDate(subscription.currentPeriodStart)}</p>
                    </div>
                    <div className="bg-jarvis-dark/50 rounded-md p-2">
                      <p className="text-[9px] text-muted-foreground/40">Próxima Cobrança</p>
                      <p className="text-xs text-foreground/70">{formatDate(subscription.currentPeriodEnd)}</p>
                    </div>
                  </div>
                  {subscription.cancelAtPeriodEnd && (
                    <div className="mt-2 p-2 bg-yellow-400/5 border border-yellow-400/10 rounded-md">
                      <p className="text-[10px] text-yellow-400/70">⚠️ Assinatura será cancelada ao fim do período</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <CreditCard className="h-8 w-8 text-jarvis-cyan/15 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground/40">Nenhuma assinatura ativa</p>
                  <p className="text-[10px] text-muted-foreground/30">Escolha um plano abaixo para começar</p>
                </div>
              )}
            </motion.div>

            {/* Plan Comparison */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-[10px] tracking-[0.2em] text-muted-foreground/50 uppercase mb-3">
                Planos Disponíveis
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {Object.entries(PLAN_CONFIG).map(([key, plan], i) => {
                  const PlanIcon = plan.icon;
                  const isCurrentPlan = currentPlan === key;
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className={`jarvis-panel p-3 relative ${isCurrentPlan ? 'border-jarvis-cyan/30' : ''}`}
                    >
                      {isCurrentPlan && (
                        <div className="absolute -top-1.5 right-2">
                          <Badge className="bg-jarvis-cyan/20 text-jarvis-cyan text-[7px] h-4 px-1.5 border-jarvis-cyan/30">
                            Atual
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded-md ${plan.color.split(' ')[0]}`}>
                          <PlanIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground/80">{plan.label}</p>
                          <p className="text-[10px] text-jarvis-cyan/60 font-medium">{plan.price}</p>
                        </div>
                      </div>
                      <ul className="space-y-1 mb-3">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-1 text-[9px] text-foreground/50">
                            <Check className="h-2.5 w-2.5 text-emerald-400/60 shrink-0 mt-0.5" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {!isCurrentPlan && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCheckout(key)}
                          disabled={checkoutPlan === key}
                          className={`w-full text-[10px] ${plan.color} hover:opacity-80 border`}
                        >
                          {checkoutPlan === key ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            'Assinar'
                          )}
                        </Button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Stripe Config */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="jarvis-panel p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] tracking-[0.2em] text-muted-foreground/50 uppercase flex items-center gap-1.5">
                  <Settings className="h-3 w-3" />
                  Configurar Stripe
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfig(!showConfig)}
                  className="text-jarvis-cyan/40 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan h-6"
                >
                  {showConfig ? <X className="h-3 w-3" /> : <Settings className="h-3 w-3" />}
                </Button>
              </div>

              {/* Current config status */}
              {stripeConfig && !showConfig && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground/50">Modo</span>
                    <Badge variant="outline" className={`text-[8px] h-4 px-1.5 ${stripeConfig.mode === 'live' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'}`}>
                      {stripeConfig.mode === 'live' ? 'Produção' : 'Teste'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground/50">Chave Pública</span>
                    <span className="text-[9px] text-foreground/40 font-mono">{stripeConfig.publicKey.substring(0, 12)}...</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground/50">Chave Secreta</span>
                    <span className="text-[9px] text-foreground/40 font-mono">{stripeConfig.secretKey.substring(0, 8)}****</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground/50">Status</span>
                    <div className="flex items-center gap-1">
                      <div className={`h-1.5 w-1.5 rounded-full ${stripeConfig.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      <span className="text-[9px] text-muted-foreground/50">{stripeConfig.isActive ? 'Ativo' : 'Inativo'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Config form */}
              <AnimatePresence>
                {showConfig && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 mt-2 pt-2 border-t border-jarvis-border/20">
                      <Input
                        value={configData.publicKey}
                        onChange={(e) => setConfigData((p) => ({ ...p, publicKey: e.target.value }))}
                        placeholder="Chave Pública (pk_...)"
                        className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40 font-mono"
                      />
                      <div className="relative">
                        <Input
                          value={configData.secretKey}
                          onChange={(e) => setConfigData((p) => ({ ...p, secretKey: e.target.value }))}
                          placeholder="Chave Secreta (sk_...)"
                          type={showSecret ? 'text' : 'password'}
                          className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40 font-mono pr-8"
                        />
                        <button
                          onClick={() => setShowSecret(!showSecret)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-jarvis-cyan"
                        >
                          {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground/50">Modo</span>
                        <button
                          onClick={() => setConfigData((p) => ({ ...p, mode: p.mode === 'test' ? 'live' : 'test' }))}
                          className="flex items-center gap-1.5"
                        >
                          {configData.mode === 'test' ? (
                            <ToggleLeft className="h-5 w-5 text-yellow-400/60" />
                          ) : (
                            <ToggleRight className="h-5 w-5 text-emerald-400/60" />
                          )}
                          <span className={`text-[10px] ${configData.mode === 'test' ? 'text-yellow-400/60' : 'text-emerald-400/60'}`}>
                            {configData.mode === 'test' ? 'Teste' : 'Produção'}
                          </span>
                        </button>
                      </div>
                      <Button
                        onClick={handleConfigure}
                        disabled={configuring || !configData.publicKey.trim() || !configData.secretKey.trim()}
                        className="bg-jarvis-cyan/20 text-jarvis-cyan hover:bg-jarvis-cyan/30 border border-jarvis-cyan/20 gap-2 w-full"
                        size="sm"
                      >
                        {configuring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
                        Salvar Configuração
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!stripeConfig && !showConfig && (
                <div className="text-center py-3">
                  <p className="text-[10px] text-muted-foreground/30 mb-2">Nenhuma configuração Stripe</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfig(true)}
                    className="text-jarvis-cyan/50 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan gap-1.5"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Configurar
                  </Button>
                </div>
              )}
            </motion.div>

            {/* Revenue metrics (if applicable) */}
            {subscription && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-[10px] tracking-[0.2em] text-muted-foreground/50 uppercase mb-3">
                  Métricas de Receita
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="jarvis-panel p-3 text-center">
                    <p className="text-lg font-bold text-jarvis-cyan jarvis-glow-text">1</p>
                    <p className="text-[9px] text-muted-foreground/50">Assinaturas</p>
                  </div>
                  <div className="jarvis-panel p-3 text-center">
                    <p className="text-lg font-bold text-jarvis-cyan jarvis-glow-text">
                      {PLAN_CONFIG[currentPlan]?.price.split('/')[0] || 'R$ 0'}
                    </p>
                    <p className="text-[9px] text-muted-foreground/50">MRR</p>
                  </div>
                  <div className="jarvis-panel p-3 text-center">
                    <p className="text-lg font-bold text-emerald-400">Ativo</p>
                    <p className="text-[9px] text-muted-foreground/50">Status</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

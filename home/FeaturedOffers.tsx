import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getFeaturedPromotions, getActivePromotions } from '@/db/api';
import type { Promotion } from '@/types/types';
import { Tag, Percent, Wallet, Gift, Package, ChevronRight, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

const FeaturedOffers = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [featuredPromo, setFeaturedPromo] = useState<Promotion | null>(null);
  const [otherPromos, setOtherPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const featured = await getFeaturedPromotions(1);
      const active = await getActivePromotions();
      
      if (featured.length > 0) {
        setFeaturedPromo(featured[0]);
        // Get other active promotions (excluding the featured one)
        const others = active.filter(p => p.id !== featured[0].id).slice(0, 3);
        setOtherPromos(others);
      } else if (active.length > 0) {
        // If no featured, show first active as main
        setFeaturedPromo(active[0]);
        setOtherPromos(active.slice(1, 4));
      }
    } catch (error) {
      console.error('Failed to load promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'discount': return <Percent className="h-5 w-5" />;
      case 'cashback': return <Wallet className="h-5 w-5" />;
      case 'free_item': return <Gift className="h-5 w-5" />;
      case 'bundle': return <Package className="h-5 w-5" />;
      default: return <Tag className="h-5 w-5" />;
    }
  };

  const copyPromoCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast({
      title: t('offers.copied'),
      description: t('offers.copiedDesc'),
    });
  };

  if (loading) {
    return (
      <Card className="glass-card p-6 border-0 shadow-soft-lg animate-fade-in">
        <div className="flex items-center justify-center py-8">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      </Card>
    );
  }

  if (!featuredPromo && otherPromos.length === 0) {
    return null; // Don't show widget if no promotions
  }

  return (
    <Card className="glass-card p-6 border-0 shadow-soft-lg animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2" dir="rtl">
            <Tag className="h-6 w-6 text-amber-600" />
            {t('offers.title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1" dir="rtl">
            {t('offers.subtitle')}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/offers-promotions')}
          className="text-amber-600 hover:text-amber-700"
        >
          <span dir="rtl">{t('offers.viewAll')}</span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Featured Promotion Banner */}
      {featuredPromo && (
        <Card
          onClick={() => navigate('/offers-promotions')}
          className="group relative overflow-hidden cursor-pointer mb-4 border-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 transition-all duration-300"
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                  {getTypeIcon(featuredPromo.type)}
                </div>
                <Badge className="bg-amber-600 text-white" dir="rtl">{t('offers.featured')}</Badge>
              </div>
              {featuredPromo.promo_code && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {featuredPromo.promo_code}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => copyPromoCode(featuredPromo.promo_code!, e)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            <h3 className="text-xl font-bold mb-1 group-hover:text-amber-600 transition-colors">
              {featuredPromo.title_en}
            </h3>
            <p className="text-sm text-muted-foreground mb-2" dir="rtl">
              {featuredPromo.title_ar}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {featuredPromo.description_en}
            </p>

            {featuredPromo.discount_value && (
              <div className="inline-block px-3 py-1 rounded-lg bg-amber-600/20 text-amber-600 font-semibold text-sm mb-2">
                {featuredPromo.discount_type === 'percentage' && `${featuredPromo.discount_value}% OFF`}
                {featuredPromo.discount_type === 'fixed_amount' && `${featuredPromo.discount_value} SAR OFF`}
              </div>
            )}

            <p className="text-xs text-muted-foreground" dir="rtl">
              {t('offers.validUntil')} {format(new Date(featuredPromo.end_date), 'dd MMM yyyy')}
            </p>
          </div>
        </Card>
      )}

      {/* Other Active Promotions */}
      {otherPromos.length > 0 && (
        <div className="space-y-2">
          {otherPromos.map((promo) => (
            <div
              key={promo.id}
              onClick={() => navigate('/offers-promotions')}
              className="group flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex-shrink-0">
                  {getTypeIcon(promo.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate group-hover:text-amber-600 transition-colors">
                    {promo.title_en}
                  </p>
                  {promo.promo_code && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {promo.promo_code}
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-600 transition-colors flex-shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* View All Link */}
      <Button
        variant="outline"
        className="w-full mt-4"
        onClick={() => navigate('/offers-promotions')}
      >
        <span dir="rtl">{t('offers.viewAll')}</span>
      </Button>
    </Card>
  );
};

export default FeaturedOffers;

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
// 1. Importa o cliente do Supabase
import { supabase } from '@/lib/supabaseClient'; 
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import FadeInView from '../components/shared/FadeInView';
import SectionHeading from '../components/shared/SectionHeading';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '@/lib/leafletFix';

export default function Contact() {
  const { t } = useLanguage();
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      // 2. Enviar a mensagem para a tabela contact_messages no Supabase
      const { error } = await supabase
        .from('contact_messages')
        .insert([form]);

      if (error) throw error;

      // Limpar formulário e dar feedback de sucesso
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      toast({ title: t('contact.success') });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({ 
        variant: "destructive", 
        title: "Erro", 
        description: "Não foi possível enviar a mensagem. Tente novamente." 
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pt-20">
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeading title={t('contact.title')} subtitle={t('contact.subtitle')} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mt-8">
            <FadeInView>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm mb-2 block">{t('contact.name')}</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="rounded-lg" />
                  </div>
                  <div>
                    <Label className="text-sm mb-2 block">{t('contact.email')}</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="rounded-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm mb-2 block">{t('contact.phone')}</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-lg" />
                  </div>
                  <div>
                    <Label className="text-sm mb-2 block">{t('contact.subject')}</Label>
                    <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="rounded-lg" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm mb-2 block">{t('contact.message')}</Label>
                  <Textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required className="rounded-lg" />
                </div>
                <Button type="submit" disabled={sending} className="rounded-full px-10 py-3 h-auto">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  {t('contact.send')}
                </Button>
              </form>
            </FadeInView>

            <FadeInView delay={0.2}>
              <div className="space-y-8">
                <div className="space-y-4">
                  <a href="mailto:ericeirawavehouse@gmail.com" className="flex items-center gap-3 text-foreground/80 hover:text-primary transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    ericeirawavehouse@gmail.com
                  </a>
                  <a href="tel:+351960461100" className="flex items-center gap-3 text-foreground/80 hover:text-primary transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    +351 960 461 100 
                  </a>
                  <div className="flex items-center gap-3 text-foreground/80">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    Ericeira, Portugal
                  </div>
                </div>
              </div>
            </FadeInView>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="h-[400px] md:h-[450px]">
        <MapContainer center={[38.9621115689151, -9.413252797607056]} zoom={14} className="h-full w-full z-0">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
          <Marker position={[38.9621115689151, -9.413252797607056]}>
            <Popup>Ericeira Wave House</Popup>
          </Marker>
        </MapContainer>
      </section>
    </div>
  );
}
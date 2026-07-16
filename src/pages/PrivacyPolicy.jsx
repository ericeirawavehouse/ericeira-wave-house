import React from 'react';
import { useLanguage } from '@/lib/i18n';
import FadeInView from '../components/shared/FadeInView';

const content = {
  pt: {
    title: 'Informações Legais',
    lastUpdated: 'Última atualização: 14/07/2026',
    intro: 'Bem-vindo à Ericeira Wave House. Nesta página poderá consultar a nossa Política de Privacidade, Política de Cookies, Informação Legal e os Termos e Condições de Reserva aplicáveis às reservas efetuadas através deste website.',
    sections: [
      {
        title: '1. Política de Privacidade',
        blocks: [
          { p: 'A Ericeira Wave House respeita a privacidade dos utilizadores do presente website e compromete-se a proteger os seus dados pessoais, em conformidade com o Regulamento (UE) 2016/679 (Regulamento Geral sobre a Proteção de Dados – RGPD) e restante legislação aplicável.' },
          { h: '1.1 Responsável pelo Tratamento dos Dados', list: [
            'Responsável: Anna Carolina Myers da Silva Luzia',
            'NIF: 261333313',
            'Morada: Rua João de Deus Oliveira, 28',
            'E-mail: ericeirawavehouse@gmail.com',
            'Telefone: +351 960 461 100',
          ] },
          { h: '1.2 Dados Pessoais Recolhidos', p: 'Através deste website poderemos recolher os seguintes dados pessoais:', list: [
            'Nome',
            'Endereço de e-mail',
            'Número de telefone',
            'Datas pretendidas para a estadia',
            'Número de hóspedes',
            'Qualquer outra informação fornecida voluntariamente através do formulário de contacto ou pedido de reserva',
          ] },
          { h: '1.3 Finalidade do Tratamento', p: 'Os dados pessoais recolhidos destinam-se exclusivamente a:', list: [
            'Responder a pedidos de informação',
            'Processar e gerir pedidos de reserva',
            'Comunicar com os hóspedes antes, durante e após a estadia',
            'Cumprir obrigações legais aplicáveis à atividade de Alojamento Local',
          ], after: 'Os dados nunca serão vendidos, alugados ou cedidos a terceiros para fins comerciais.' },
          { h: '1.4 Base Legal', p: 'O tratamento dos dados baseia-se em:', list: [
            'Diligências pré-contratuais solicitadas pelo utilizador',
            'Execução de contrato',
            'Cumprimento de obrigações legais',
            'Consentimento do titular dos dados, quando aplicável',
          ] },
          { h: '1.5 Conservação dos Dados', p: 'Os dados pessoais serão conservados apenas durante o período necessário para cumprir as finalidades para as quais foram recolhidos ou durante os prazos legalmente exigidos.' },
          { h: '1.6 Partilha de Dados', p: 'Os dados poderão ser partilhados apenas quando necessário para:', list: [
            'Cumprimento de obrigações legais',
            'Autoridades públicas competentes',
            'Prestadores de serviços tecnológicos que asseguram o funcionamento do website, sujeitos a dever de confidencialidade',
          ] },
          { h: '1.7 Direitos dos Titulares', p: 'Nos termos da legislação aplicável, o titular dos dados poderá exercer os seguintes direitos:', list: [
            'Direito de acesso',
            'Direito de retificação',
            'Direito ao apagamento',
            'Direito à limitação do tratamento',
            'Direito de oposição',
            'Direito à portabilidade dos dados',
            'Direito de retirar o consentimento, quando aplicável',
          ], after: 'Para exercer qualquer destes direitos, contacte-nos através do endereço de e-mail indicado acima. Caso considere que os seus direitos não foram respeitados, poderá apresentar reclamação junto da Comissão Nacional de Proteção de Dados (CNPD).' },
          { h: '1.8 Segurança', p: 'A Ericeira Wave House adota medidas técnicas e organizativas adequadas para proteger os dados pessoais contra perda, utilização indevida, acesso não autorizado, alteração ou divulgação.' },
          { h: '1.9 Alterações', p: 'A presente Política de Privacidade poderá ser atualizada sempre que necessário. A versão publicada neste website será sempre a mais recente.' },
        ],
      },
      {
        title: '2. Política de Cookies',
        blocks: [
          { p: 'Este website utiliza cookies para melhorar a experiência de navegação e assegurar o seu correto funcionamento.' },
          { h: '2.1 O que são Cookies?', p: 'Cookies são pequenos ficheiros de texto armazenados no dispositivo do utilizador quando visita um website.' },
          { h: '2.2 Cookies Utilizados', p: 'Atualmente, este website utiliza apenas cookies estritamente necessários ao seu funcionamento. Caso venham a ser utilizados cookies analíticos ou de marketing (por exemplo, Google Analytics), será solicitado o consentimento prévio do utilizador através do respetivo banner de cookies.' },
          { h: '2.3 Gestão de Cookies', p: 'Ao aceder ao website poderá aceitar, rejeitar ou configurar os cookies, quando aplicável. Poderá ainda alterar as suas preferências através das definições do seu navegador. A desativação de determinados cookies poderá limitar algumas funcionalidades do website.' },
        ],
      },
      {
        title: '3. Informação Legal',
        blocks: [
          { h: 'Identificação', list: [
            'Ericeira Wave House',
            'Registo de Alojamento Local: 175410/AL',
            'Titular: Anna Carolina Myers da Silva Luzia',
            'NIF: 261333313',
            'Morada: Rua João de Deus Oliveira, 28',
            'E-mail: ericeirawavehouse@gmail.com',
            'Telefone: +351 960 461 100',
          ] },
          { h: 'Livro de Reclamações', p: 'Nos termos da legislação em vigor, este alojamento dispõe de Livro de Reclamações Eletrónico. O mesmo poderá ser consultado em:', link: 'https://www.livroreclamacoes.pt' },
          { h: 'Resolução Alternativa de Litígios', p: 'Em caso de litígio de consumo, o consumidor poderá recorrer a uma Entidade de Resolução Alternativa de Litígios de Consumo, nos termos da legislação portuguesa. Mais informações em:', link: 'https://www.consumidor.gov.pt' },
        ],
      },
      {
        title: '4. Termos e Condições de Reserva',
        blocks: [
          { p: 'Ao efetuar uma reserva através deste website, o hóspede declara ter lido, compreendido e aceite os presentes Termos e Condições.' },
          { h: '4.1 Reservas', p: 'As reservas estão sempre sujeitas à disponibilidade do alojamento. Após o envio do pedido de reserva, entraremos em contacto para confirmar a disponibilidade e fornecer as instruções para pagamento do sinal. A reserva apenas será considerada confirmada após a receção do respetivo pagamento.' },
          { h: '4.2 Pagamento', p: 'Para confirmação da reserva será solicitado um sinal correspondente a 30% do valor total da estadia. Os restantes 70% deverão ser pagos no momento do check-in, através do meio de pagamento previamente acordado entre as partes.' },
          { h: '4.3 Política de Cancelamento', list: [
            'O sinal pago corresponde a 30% do valor total da reserva.',
            'Cancelamentos efetuados com mais de 30 dias de antecedência relativamente à data de check-in dão direito ao reembolso integral do sinal.',
            'Cancelamentos efetuados até 30 dias antes da data de check-in não conferem direito ao reembolso do sinal.',
            'Em caso de não comparência ("no-show"), a reserva será considerada cancelada e o sinal será retido.',
            'Pedidos de alteração de datas estarão sempre sujeitos à disponibilidade do alojamento e deverão ser solicitados por escrito.',
            'Em situações excecionais de força maior, devidamente comprovadas, poderá ser analisada uma solução alternativa, sem que exista obrigação de reembolso.',
          ] },
          { h: '4.4 Check-in e Check-out', list: [
            'Check-in: a partir das 15h00',
            'Check-out: até às 12h00',
            'Pedidos de check-in antecipado ou check-out tardio poderão ser aceites mediante disponibilidade e confirmação prévia.',
          ] },
          { h: '4.5 Ocupação', p: 'A capacidade máxima da Ericeira Wave House é de 5 hóspedes.' },
          { h: '4.6 Regras da Casa', p: 'Para garantir uma estadia tranquila e agradável para todos os hóspedes, solicita-se o cumprimento das seguintes regras:', list: [
            'Não são permitidas festas ou eventos.',
            'Não é permitido fumar no interior do alojamento.',
            'É proibido o consumo de drogas ilegais, estupefacientes ou substâncias psicotrópicas.',
            'Não são permitidos animais de estimação, salvo autorização prévia por escrito.',
            'Deve ser respeitado o horário de silêncio entre as 23h00 e as 07h00.',
            'O alojamento deverá ser utilizado de forma responsável, preservando o mobiliário, equipamentos e restantes bens existentes.',
          ] },
          { h: '4.7 Danos', p: 'O hóspede compromete-se a comunicar qualquer dano ocorrido durante a estadia. Sempre que sejam verificados danos resultantes de utilização negligente ou indevida, poderá ser solicitado o pagamento do respetivo custo de reparação ou substituição.' },
          { h: '4.8 Responsabilidade', p: 'A Ericeira Wave House não poderá ser responsabilizada por:', list: [
            'Perda, furto ou dano de objetos pessoais dos hóspedes',
            'Interrupções temporárias de serviços públicos (água, eletricidade, internet ou telecomunicações) alheias ao seu controlo',
            'Situações de força maior, incluindo fenómenos naturais, greves ou determinações das autoridades competentes',
          ] },
          { h: '4.9 Experiências de Surf', p: 'A Ericeira Wave House apoia os hóspedes na organização de aulas de surf através de escolas de surf parceiras de confiança.' },
          { p: 'Estes serviços são prestados pela respetiva escola de surf, que é responsável pela organização da atividade, normas de segurança, seguros, horários e pelos seus próprios termos e condições.' },
          { p: 'A participação em aulas de surf é voluntária e por conta e risco do hóspede. Os hóspedes são responsáveis por garantir que têm aptidão física para participar e por seguir todas as instruções fornecidas pelo prestador da atividade.' },
          { p: 'A Ericeira Wave House atua como facilitadora e não poderá ser responsabilizada por cancelamentos, atrasos, lesões, acidentes, perdas ou danos resultantes de serviços prestados por prestadores de atividades terceiros.' },
          { h: '4.10 Proteção de Dados', p: 'Os dados pessoais fornecidos durante o processo de reserva serão tratados de acordo com a presente Política de Privacidade e utilizados exclusivamente para gestão da reserva e cumprimento das obrigações legais.' },
          { h: '4.11 Lei Aplicável', p: 'Os presentes Termos e Condições são regidos pela legislação portuguesa. Em caso de litígio de consumo, o consumidor poderá recorrer a uma Entidade de Resolução Alternativa de Litígios de Consumo. Mais informações encontram-se disponíveis em:', link: 'https://www.consumidor.gov.pt' },
          { h: '4.12 Contactos', p: 'Para qualquer questão relacionada com reservas, disponibilidade ou estadias, poderá contactar-nos através de:', list: [
            'Ericeira Wave House',
            'E-mail: ericeirawavehouse@gmail.com',
            'Telefone: +351 960 461 100',
            'Formulário de contacto: disponível na página "Contacto" deste website.',
          ], after: 'Responderemos com a maior brevidade possível.' },
        ],
      },
    ],
  },
  en: {
    title: 'Legal Information',
    lastUpdated: 'Last updated: 14/07/2026',
    intro: 'Welcome to Ericeira Wave House. On this page you can find our Privacy Policy, Cookie Policy, Legal Information and the Booking Terms & Conditions applicable to bookings made through this website.',
    note: 'This English version is provided for convenience. The Portuguese version is the legally binding text and prevails in case of any discrepancy.',
    sections: [
      {
        title: '1. Privacy Policy',
        blocks: [
          { p: 'Ericeira Wave House respects the privacy of this website\'s users and is committed to protecting their personal data, in accordance with Regulation (EU) 2016/679 (General Data Protection Regulation – GDPR) and other applicable legislation.' },
          { h: '1.1 Data Controller', list: [
            'Data Controller: Anna Carolina Myers da Silva Luzia',
            'Tax ID (NIF): 261333313',
            'Address: Rua João de Deus Oliveira, 28',
            'E-mail: ericeirawavehouse@gmail.com',
            'Phone: +351 960 461 100',
          ] },
          { h: '1.2 Personal Data Collected', p: 'Through this website we may collect the following personal data:', list: [
            'Name',
            'E-mail address',
            'Phone number',
            'Intended stay dates',
            'Number of guests',
            'Any other information voluntarily provided through the contact form or booking request',
          ] },
          { h: '1.3 Purpose of Processing', p: 'The personal data collected is intended exclusively to:', list: [
            'Respond to information requests',
            'Process and manage booking requests',
            'Communicate with guests before, during and after the stay',
            'Comply with legal obligations applicable to the Local Accommodation (Alojamento Local) activity',
          ], after: 'Data will never be sold, rented or transferred to third parties for commercial purposes.' },
          { h: '1.4 Legal Basis', p: 'The processing of data is based on:', list: [
            'Pre-contractual steps requested by the user',
            'Performance of a contract',
            'Compliance with legal obligations',
            'Consent of the data subject, where applicable',
          ] },
          { h: '1.5 Data Retention', p: 'Personal data will be kept only for the period necessary to fulfil the purposes for which it was collected, or for the periods legally required.' },
          { h: '1.6 Data Sharing', p: 'Data may only be shared when necessary for:', list: [
            'Compliance with legal obligations',
            'Competent public authorities',
            'Technology service providers that ensure the operation of the website, subject to a duty of confidentiality',
          ] },
          { h: '1.7 Data Subject Rights', p: 'Under applicable law, the data subject may exercise the following rights:', list: [
            'Right of access',
            'Right of rectification',
            'Right to erasure',
            'Right to restriction of processing',
            'Right to object',
            'Right to data portability',
            'Right to withdraw consent, where applicable',
          ], after: 'To exercise any of these rights, please contact us at the e-mail address indicated above. If you believe your rights have not been respected, you may file a complaint with the Comissão Nacional de Proteção de Dados (CNPD), the Portuguese data protection authority.' },
          { h: '1.8 Security', p: 'Ericeira Wave House adopts appropriate technical and organisational measures to protect personal data against loss, misuse, unauthorised access, alteration or disclosure.' },
          { h: '1.9 Changes', p: 'This Privacy Policy may be updated whenever necessary. The version published on this website will always be the most recent.' },
        ],
      },
      {
        title: '2. Cookie Policy',
        blocks: [
          { p: 'This website uses cookies to improve the browsing experience and ensure its correct operation.' },
          { h: '2.1 What are Cookies?', p: 'Cookies are small text files stored on the user\'s device when visiting a website.' },
          { h: '2.2 Cookies Used', p: 'Currently, this website only uses cookies strictly necessary for its operation. If analytics or marketing cookies (e.g. Google Analytics) are used in the future, the user\'s prior consent will be requested through the corresponding cookie banner.' },
          { h: '2.3 Cookie Management', p: 'When accessing the website, you may accept, reject or configure cookies, where applicable. You may also change your preferences through your browser settings. Disabling certain cookies may limit some of the website\'s features.' },
        ],
      },
      {
        title: '3. Legal Information',
        blocks: [
          { h: 'Identification', list: [
            'Ericeira Wave House',
            'Local Accommodation Registration: 175410/AL',
            'Owner: Anna Carolina Myers da Silva Luzia',
            'Tax ID (NIF): 261333313',
            'Address: Rua João de Deus Oliveira, 28',
            'E-mail: ericeirawavehouse@gmail.com',
            'Phone: +351 960 461 100',
          ] },
          { h: 'Complaints Book', p: 'Under current legislation, this accommodation has an Electronic Complaints Book (Livro de Reclamações Eletrónico), available at:', link: 'https://www.livroreclamacoes.pt' },
          { h: 'Alternative Dispute Resolution', p: 'In the event of a consumer dispute, the consumer may resort to a Consumer Alternative Dispute Resolution Entity, under Portuguese law. More information at:', link: 'https://www.consumidor.gov.pt' },
        ],
      },
      {
        title: '4. Booking Terms & Conditions',
        blocks: [
          { p: 'By making a booking through this website, the guest declares to have read, understood and accepted these Terms & Conditions.' },
          { h: '4.1 Bookings', p: 'Bookings are always subject to accommodation availability. After a booking request is submitted, we will contact you to confirm availability and provide instructions for the deposit payment. The booking is only considered confirmed once the corresponding payment has been received.' },
          { h: '4.2 Payment', p: 'To confirm the booking, a deposit corresponding to 30% of the total stay value will be requested. The remaining 70% must be paid at check-in, through the payment method previously agreed between the parties.' },
          { h: '4.3 Cancellation Policy', list: [
            'The deposit paid corresponds to 30% of the total booking value.',
            'Cancellations made more than 30 days before the check-in date are entitled to a full refund of the deposit.',
            'Cancellations made up to 30 days before the check-in date are not entitled to a refund of the deposit.',
            'In the event of a no-show, the booking will be considered cancelled and the deposit will be retained.',
            'Date change requests are always subject to accommodation availability and must be requested in writing.',
            'In exceptional force majeure situations, duly proven, an alternative solution may be considered, without any obligation of refund.',
          ] },
          { h: '4.4 Check-in and Check-out', list: [
            'Check-in: from 3:00 PM',
            'Check-out: until 12:00 PM',
            'Early check-in or late check-out requests may be accepted subject to availability and prior confirmation.',
          ] },
          { h: '4.5 Occupancy', p: 'The maximum capacity of Ericeira Wave House is 5 guests.' },
          { h: '4.6 House Rules', p: 'To ensure a peaceful and pleasant stay for all guests, please comply with the following rules:', list: [
            'Parties or events are not allowed.',
            'Smoking indoors is not allowed.',
            'Consumption of illegal drugs, narcotics or psychotropic substances is prohibited.',
            'Pets are not allowed, unless prior written authorisation is given.',
            'Quiet hours between 11:00 PM and 7:00 AM must be respected.',
            'The accommodation must be used responsibly, preserving the furniture, equipment and other existing property.',
          ] },
          { h: '4.7 Damages', p: 'The guest agrees to report any damage that occurs during the stay. Where damage results from negligent or improper use, payment for the corresponding repair or replacement cost may be requested.' },
          { h: '4.8 Liability', p: 'Ericeira Wave House cannot be held liable for:', list: [
            'Loss, theft or damage of guests\' personal belongings',
            'Temporary interruptions of public services (water, electricity, internet or telecommunications) beyond its control',
            'Force majeure events, including natural phenomena, strikes or decisions by the competent authorities',
          ] },
          { h: '4.9 Surf Experiences', p: 'Ericeira Wave House assists guests in arranging surf lessons through trusted partner surf schools.' },
          { p: 'These services are provided by the respective surf school, which is responsible for the organisation of the activity, safety standards, insurance, schedules and its own terms and conditions.' },
          { p: 'Participation in surf lessons is voluntary and at the guest\'s own risk. Guests are responsible for ensuring they are physically fit to participate and for following all instructions provided by the activity provider.' },
          { p: 'Ericeira Wave House acts as a facilitator and shall not be liable for cancellations, delays, injuries, accidents, loss or damage arising from services provided by third-party activity providers.' },
          { h: '4.10 Data Protection', p: 'Personal data provided during the booking process will be processed in accordance with this Privacy Policy and used exclusively for booking management and compliance with legal obligations.' },
          { h: '4.11 Governing Law', p: 'These Terms & Conditions are governed by Portuguese law. In the event of a consumer dispute, the consumer may resort to a Consumer Alternative Dispute Resolution Entity. More information is available at:', link: 'https://www.consumidor.gov.pt' },
          { h: '4.12 Contact', p: 'For any questions related to bookings, availability or stays, you may contact us at:', list: [
            'Ericeira Wave House',
            'E-mail: ericeirawavehouse@gmail.com',
            'Phone: +351 960 461 100',
            'Contact form: available on the "Contact" page of this website.',
          ], after: 'We will respond as soon as possible.' },
        ],
      },
    ],
  },
};

function Block({ block }) {
  return (
    <div className="mb-5">
      {block.h && <h3 className="font-medium text-base mb-2">{block.h}</h3>}
      {block.p && <p className="text-sm text-muted-foreground leading-relaxed mb-2">{block.p}</p>}
      {block.list && (
        <ul className="list-disc list-inside space-y-1 mb-2">
          {block.list.map((item, i) => (
            <li key={i} className="text-sm text-muted-foreground leading-relaxed">{item}</li>
          ))}
        </ul>
      )}
      {block.link && (
        <a href={block.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
          {block.link}
        </a>
      )}
      {block.after && <p className="text-sm text-muted-foreground leading-relaxed mt-2">{block.after}</p>}
    </div>
  );
}

export default function PrivacyPolicy() {
  const { lang } = useLanguage();
  const data = content[lang] || content.pt;

  return (
    <div className="pt-20 min-h-screen pb-24">
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <FadeInView>
            <h1 className="font-heading text-3xl md:text-4xl font-semibold mb-2">{data.title}</h1>
            <p className="text-xs text-muted-foreground mb-6">{data.lastUpdated}</p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{data.intro}</p>
            {data.note && (
              <p className="text-xs text-muted-foreground italic leading-relaxed mb-10 border-l-2 border-primary/30 pl-4">{data.note}</p>
            )}
          </FadeInView>

          <div className="space-y-12">
            {data.sections.map((section) => (
              <FadeInView key={section.title}>
                <h2 className="font-heading text-2xl font-semibold mb-6">{section.title}</h2>
                {section.blocks.map((block, i) => (
                  <Block key={i} block={block} />
                ))}
              </FadeInView>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

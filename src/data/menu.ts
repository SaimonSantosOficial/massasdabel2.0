import { Bairro, MenuItem } from '../types';

const gImg = (id: string) => `https://wsrv.nl/?url=drive.google.com/uc?id=${id}`;

export const MENU_DATA = {
  massas: [
    { nome: 'Spaguetti', img: gImg('1ELDbZ-wOAsrZ8Nz7oQQ7j6xSEc80ehl7') },
    { nome: 'Penne', img: gImg('1LkRzBxUo9-maI-Yj07xZEOgWvoJbuApy') },
    { nome: 'Fettuccine (Ninho)', img: gImg('1ICF99nN1RogXzUKzCnfCrIT2YD4QUtbF') },
    { nome: 'Parafuso', img: gImg('1P7OhPxHamwTyqrqf0GWH1Sf0AJmd3OE0') },
  ] as MenuItem[],
  molhos: [
    { nome: 'Molho Vermelho', img: gImg('1O5-GuS7TRAp4FrZmdDp9NOB6SsZfkBTA') },
    { nome: 'Molho Branco', img: gImg('1jiAf69ug3s5Umu2QeQscgtyUIziz-nfX') },
  ] as MenuItem[],
  adicionais: [
    { nome: 'Azeitonas', preco: 3.00, img: gImg('1UboCSZUzpEA4aswA-GUlCHj-32NUjZ1K') },
    { nome: 'Ovo de Codorna', preco: 1.50, img: gImg('1y4iVBXtNLolspT2IZw48CSJp73EA4XqT') },
    { nome: 'Queijo Parmesão Ralado', preco: 3.00, img: gImg('1EnwFVWWWptgStN8VbOnZjLxJCDwAhxzL') },
    { nome: 'Batata Palha', preco: 3.00, img: gImg('1TkhMRI8HYv-ZlQN1GAQqYtFotKdLIIB4') },
  ] as MenuItem[],
  sabores: [
    { nome: 'Frango', p: 12.00, g: 22.00, img: gImg('1vMymrNslS3SnuOzhR9XX_zByBC_ZUPZL') },
    { nome: 'Calabresa', p: 13.00, g: 24.00, img: gImg('1ytnM0dGN8TbsqZ5FDbk7F8Zz11aN_3uu') },
    { nome: 'Carne Moída', p: 14.00, g: 26.00, img: gImg('1evQGDWby_aobR91C9p9f6PwOf_N8zzzH') },
    { nome: 'Carne de Sol', p: 15.00, g: 28.00, img: gImg('1fHqO_idutI46-fyZv8jvw65fR26torhZ') },
  ] as MenuItem[],
  complementos: [
    { nome: 'Mussarela', img: gImg('1h-bH_gOEiitQn7zN9WKVzLdWPX6Tnu-E') },
    { nome: 'Cebola', img: gImg('1KDe3tOFzwMplHYEBCQEkKLSsehbslHNU') },
    { nome: 'Pimentinha', img: gImg('1C1m1Wh5pIlr42uSu3D6AdfbkgSa59jUN') },
    { nome: 'Tomate', img: gImg('1EZv2FrTm8wL4W0wXUN4vSChgABfNGBwA') },
    { nome: 'Presunto', img: gImg('1BOm3epthlHWYfN1wy0tVmOc5-FWE6LXb') },
    { nome: 'Coentro', img: gImg('1eohMX0GotjCt54_-DS2FgMIMdrzuNiW1') },
    { nome: 'Orégano', img: gImg('1LV7FFkHq_Gx_JwfAgrLcrbrR8j3szAka') },
    { nome: 'Bacon', img: gImg('1ODd4SPiRDx6fpPA2PxPchc3-0DhDXYwm') },
    { nome: 'Milho', img: gImg('1Vn4kPIj3uqf-Rd8YuS6T6x2QUXWHTEkZ') },
  ] as MenuItem[],
  bairros: [
    { nome: 'Aldeoma', taxa: 10.00 }, { nome: 'Centro', taxa: 10.00 }, { nome: 'Coité', taxa: 10.00 },
    { nome: 'Cônego Raimundo Pinto', taxa: 12.00 }, { nome: 'Gavião', taxa: 10.00 }, { nome: 'Guabiraba', taxa: 10.00 },
    { nome: 'Ladeira Grande', taxa: 7.00 }, { nome: 'Lages', taxa: 12.00 }, { nome: 'Lameirão', taxa: 10.00 },
    { nome: 'Novo Maranguape I', taxa: 12.00 }, { nome: 'Novo Maranguape II', taxa: 12.00 }, { nome: 'Novo Parque Iracema', taxa: 7.00 },
    { nome: 'Outra Banda', taxa: 12.00 }, { nome: 'Papara', taxa: 12.00 }, { nome: 'Parque Iracema', taxa: 12.00 },
    { nome: 'Parque Santa Fé', taxa: 10.00 }, { nome: 'Parque São João', taxa: 10.00 }, { nome: 'Pirapora', taxa: 10.00 },
    { nome: 'Preguiça', taxa: 10.00 }, { nome: 'Santos Dumont', taxa: 10.00 }, { nome: 'Sapupara', taxa: 0.00 },
    { nome: 'Tangueira', taxa: 10.00 }, { nome: 'Umarizeiras', taxa: 12.00 }, { nome: 'Urucará', taxa: 7.00 }
  ] as Bairro[]
};

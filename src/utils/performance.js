// Performances affichées dans la fiche voiture, dérivées de la puissance
export const accel = (hp) => Math.max(1.9, 221 * Math.pow(hp, -0.65));
export const vmax = (hp) => Math.round(110 + hp * 0.27);

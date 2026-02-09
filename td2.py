with open("titre.txt","r",encoding="utf-8") as f:
    T = f.read()
    
def calcul_fonct_transition(P,Sigma):
    m = len(P)
    delta = {}
    for q in range(m+1):
        for a in Sigma:
            s = P[:q] + a
            k = min(m,q+1)
            while k>0 and not s.endswith(P[:k]):
                k-=1
            dict[(q,a)] = k

def recherche_automate(T, Delta, m):
    n = len(T)
    q = 0
    decalages = []
    for i in range(n):
        a = T[i]
        q = Delta[(q,a)]
        if q == m:
            decalages.append(i-m+1)
    return decalages
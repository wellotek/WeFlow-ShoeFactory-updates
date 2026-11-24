!include "WinVer.nsh"
!include "x64.nsh"

!macro customInit
  ; 1. Verification 64-bit requis pour Electron 35
  ${IfNot} ${RunningX64}
    ${IfNot} ${Silent}
      MessageBox MB_OK|MB_ICONSTOP "WeFlow ShoeFactory est une application 64 bits (x64).$\n$\nVotre système d'exploitation est en 32 bits (x86) et ne peut pas exécuter cette application.$\n$\nVeuillez installer une version 64 bits de Windows 10 ou 11."
    ${EndIf}
    Quit
  ${EndIf}

  ; 2. Verification si l'installateur est execute depuis une cle USB ou un lecteur amovible
  ${IfNot} ${Silent}
    System::Call 'kernel32::GetDriveType(t "$EXEDIR") i .r0'
    ${If} $0 == 2 ; DRIVE_REMOVABLE
      MessageBox MB_OKCANCEL|MB_ICONINFORMATION "Conseil d'installation :$\n$\nVous exécutez l'installateur depuis une clé USB ou un disque amovible.$\n$\nPour éviter les ralentissements ou les erreurs de lecture de mémoire (code Windows 299), il est fortement conseillé de copier ce fichier sur votre Bureau avant de l'exécuter.$\n$\nCliquez sur 'OK' pour continuer l'installation depuis la clé USB, ou sur 'Annuler' pour copier le fichier sur votre Bureau." IDOK continueInstall
      Quit
      continueInstall:
    ${EndIf}
  ${EndIf}
!macroend

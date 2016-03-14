
##Q:
>
> I want to use System.Net.Sockets.UdpClient and some other system class in macro,
> but I got an error "Type 'System.Net.Sockets.UdpClient' could not be found, is an assembly reference missing?"
>
> I'm already add "import System.Net.Sockets;" at the top of my macro.
> How should I do?
>
> Something else like System.Diagnostics.ProcessStartInfo cannot be used too.

##A:
> System.Net.Sockets.UdpClient is provided by system.dll, but Poderosa doesn't make it available in the macro environment in default.
> You have to specify the additional assembly in the macro settings.
> 
> Open `Tools>Macro>Environment`
> Select your macro setting and click `Property` button
> In `Additional assemblies` text box, enter "system.dll".
> If you need more assemblies, you can specify them by separating with semicolons.


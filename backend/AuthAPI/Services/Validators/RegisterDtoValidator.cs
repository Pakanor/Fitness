using AuthAPI.Models;
using FluentValidation;


namespace AuthAPI.Services.Validators

{
    public class RegisterDtoValidator : AbstractValidator<RegisterDto>
    {
        public RegisterDtoValidator()
        {
            RuleFor(x => x.Username)
           .NotEmpty().WithMessage("Nazwa użytkownika jest wymagana")
           .MinimumLength(3).WithMessage("Nazwa użytkownika musi mieć co najmniej 3 znaki")
           .MaximumLength(20).WithMessage("Nazwa użytkownika nie może mieć więcej niż 20 znaków");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email jest wymagany")
                .EmailAddress().WithMessage("Niepoprawny format adresu email");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Hasło jest wymagane")
                .MinimumLength(8).WithMessage("Hasło musi mieć co najmniej 8 znaków")
                .Matches("[A-Z]").WithMessage("Hasło musi zawierać co najmniej jedną wielką literę")
                .Matches("[a-z]").WithMessage("Hasło musi zawierać co najmniej jedną małą literę")
                .Matches("[0-9]").WithMessage("Hasło musi zawierać co najmniej jedną cyfrę")
                .Matches("[^a-zA-Z0-9]").WithMessage("Hasło musi zawierać co najmniej jeden znak specjalny");
        }
    }
}

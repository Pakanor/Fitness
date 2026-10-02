using AuthAPI.Models;
using FluentValidation;

namespace AuthAPI.Services.Validators
{
    public class LoginDtoValidator : AbstractValidator<LoginDto>
    {
        public LoginDtoValidator()
        {
            RuleFor(x => x.EmailOrLogin)
                .NotEmpty().WithMessage("Email lub login jest wymagany");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Hasło jest wymagane");
        }
    }
}

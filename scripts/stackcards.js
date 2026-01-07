var StackCards = function(element) {
  this.element = element;
  this.items = element.getElementsByClassName('js-stack-cards__item');
  this.scrolling = false;
  this.cardHeight = this.items[0].offsetHeight;
  this.marginY = parseInt(getComputedStyle(this.items[0]).marginBottom);
  initStackCardsEffect(this);
};

function initStackCardsEffect(stack) {
  var observer = new IntersectionObserver(entries => {
    if(entries[0].isIntersecting) {
      window.addEventListener('scroll', stackCardsScroll.bind(stack));
    }
  });
  observer.observe(stack.element);
}

function stackCardsScroll() {
  if(this.scrolling) return;
  this.scrolling = true;
  window.requestAnimationFrame(() => {
    var top = this.element.getBoundingClientRect().top;
    for(var i = 0; i < this.items.length; i++) {
      var offset = i * (this.cardHeight + this.marginY);
      var scale = 1;
      if(top < offset) {
        scale = Math.max(0.8, 1 - (offset - top) / (this.cardHeight * 5));
      }
      this.items[i].style.transform = `translateY(${offset}px) scale(${scale})`;
    }
    this.scrolling = false;
  });
}

var stackCards = document.getElementsByClassName('js-stack-cards');
for(var i = 0; i < stackCards.length; i++) {
  new StackCards(stackCards[i]);
}

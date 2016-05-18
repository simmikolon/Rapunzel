//
//  LayerEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 26.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

//import UIKit
import GameplayKit
import SpriteKit

class LayerEntity: Entity {

    var parallaxFactor: CGFloat = 1.0
    let renderComponent: RenderComponent
    var parallaxScrollingComponent: ParallaxScrollingComponent!
    
    init(withParallaxFactor factor: CGFloat = 1.0, cameraComponent: CameraComponent, zPosition: CGFloat = 0.0) {
        
        renderComponent = RenderComponent()
        renderComponent.node.zPosition = zPosition
        
        super.init()
        
        parallaxFactor = factor
        parallaxScrollingComponent = ParallaxScrollingComponent(withLayerEntity: self, cameraComponent: cameraComponent)
        
        addComponent(renderComponent)
        addComponent(parallaxScrollingComponent)
    }
}

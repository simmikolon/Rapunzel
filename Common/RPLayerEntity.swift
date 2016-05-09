//
//  RPLayerEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 26.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

//import UIKit
import GameplayKit
import SpriteKit

class RPLayerEntity: RPEntity {

    var parallaxFactor: CGFloat = 1.0
    let renderComponent: RPRenderComponent
    var parallaxScrollingComponent: RPParallaxScrollingComponent!
    
    let entityManagerComponent: RPEntityManagerComponent
    var patternControllerComponent: RPPatternControllerComponent!
    
    init(withParallaxFactor factor: CGFloat = 1.0, cameraComponent: RPCameraComponent, zPosition: CGFloat = 0.0, pattern: RPPattern? = nil) {
        
        renderComponent = RPRenderComponent()
        renderComponent.node.zPosition = zPosition
        
        entityManagerComponent = RPEntityManagerComponent()
        
        super.init()
        
        parallaxFactor = factor
        parallaxScrollingComponent = RPParallaxScrollingComponent(withLayerEntity: self, cameraComponent: cameraComponent)
        
        if let pattern = pattern {
         
            patternControllerComponent = RPPatternControllerComponent(withLayerEntity: self, pattern: pattern)
            addComponent(patternControllerComponent)
        }
        
        addComponent(renderComponent)
        addComponent(parallaxScrollingComponent)
        addComponent(entityManagerComponent)
    }
}

//
//  ParallaxScrollingComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 26.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit
import SpriteKit

class ParallaxScrollingComponent: GKComponent {

    weak var layerEntity: LayerEntity!
    weak var cameraComponent: CameraComponent!
    
    init(withLayerEntity layerEntity: LayerEntity, cameraComponent: CameraComponent) {
        
        self.layerEntity = layerEntity
        self.cameraComponent = cameraComponent
        super.init()
    }
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        
        super.updateWithDeltaTime(seconds)
        
        let absoluteCameraPosition = cameraComponent.cameraNode.scene?.convertPoint(cameraComponent.cameraNode.position,
                                                                                    fromNode: cameraComponent.cameraNode.parent!)
        let factor = GameSceneSettings.SmoothingFactor + layerEntity!.parallaxFactor
        
        /* Since Rapunzel is now a vertical-only scroller there is no need to calculate offset for the x axis anymore */
        
        let x: CGFloat = 0.0 //layerEntity.renderComponent.node.position.x - (absoluteCameraPosition!.x / factor)
        
        /* We have to cut off the remainder using round() to stop a strange bug that happens only on Mac OS X SpriteKit Versions */
        /* Side-Effect is that scrolling appears to be a bit more solid since it stops on a "full" pixel */
        /* Which is an issue since resolution of Scene is less that todays high resolution of retina screens */
        
        let y = layerEntity.renderComponent.node.position.y - (round(absoluteCameraPosition!.y) / factor)
        
        layerEntity!.renderComponent.node.position = CGPoint(x: x, y: y)
        
        /* -------------------- DEBUG ------------------ */
        /*
         let className = layerEntity!.name
         print("\(className): \(y) - ABS: \(round(absoluteCameraPosition!.y))")
         */
    }
}